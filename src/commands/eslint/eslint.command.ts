import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { copyFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isNodeError } from '../../lib/helpers'
import { logger as _logger } from '../../lib/logger'
import { updatePackageJson } from '../../lib/package-json'
import { confirmPrompt } from '../../lib/prompt'

const logger = _logger.withTag('setup-eslint')

const CONFIG = {
    possibleConfigExtensions: ['mjs', 'js', 'cjs', 'ts', 'mts', 'cts'],
    // When creating a new config file, this extension will be used
    defaultConfigExtension: 'mjs',
    /**
     * @see https://github.com/antfu/eslint-config#manual-install
     * @see https://github.com/antfu/eslint-config#nextjs
     */
    requiredPackages: ['eslint', '@antfu/eslint-config', '@next/eslint-plugin-next'],
    lintFixScriptName: 'lint:fix',
}

/**
 * Installs the required ESLint dependencies.
 */
async function _installDependencies({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    logger.info(`Installing ESLint packages: ${CONFIG.requiredPackages.join(', ')}`)
    const action = packageManager === 'npm' ? 'install' : 'add'

    try {
        await execa(packageManager, [action, '-D', ...CONFIG.requiredPackages], {
            cwd,
            stdio: 'inherit',
        })
        logger.success('ESLint packages installed')
    } catch (error) {
        throw new Error('Failed to install ESLint packages', { cause: error })
    }
}

/**
 * Deletes any existing ESLint config files.
 */
async function _deleteExistingConfigs({ cwd }: { cwd: string }): Promise<void> {
    let deletedCount = 0

    for (const ext of CONFIG.possibleConfigExtensions) {
        const configPath = join(cwd, `eslint.config.${ext}`)
        try {
            await unlink(configPath)
            logger.info(`Deleted existing eslint.config.${ext}`)
            deletedCount++
        } catch (error) {
            if (isNodeError(error) && error.code === 'ENOENT') {
                // File doesn't exist, skip
                continue
            }
            // Other errors should be thrown
            throw new Error(`Failed to delete eslint.config.${ext}`, { cause: error })
        }
    }

    if (deletedCount === 0) {
        logger.info('No existing ESLint config files found')
    }
}

/**
 * Copies the sample ESLint config file to the project root.
 */
async function _copyConfigFile({ cwd }: { cwd: string }): Promise<void> {
    // TODO: Add ability to configure the config file
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const sampleConfigPath = join(__dirname, 'eslint.config.mjs')

    const targetConfigFileName = `eslint.config.${CONFIG.defaultConfigExtension}`
    const targetConfigPath = join(cwd, targetConfigFileName)

    try {
        await copyFile(sampleConfigPath, targetConfigPath)
        logger.success(`ESLint config file created: ${targetConfigFileName}`)
    } catch (error) {
        throw new Error('Failed to create ESLint config file', { cause: error })
    }
}

/**
 * Adds `lint:fix` script to package.json.
 */
async function _addLintFixScript({ cwd }: { cwd: string }): Promise<void> {
    try {
        let freshlyAdded = false
        await updatePackageJson(cwd, (pkg) => {
            const currentLintFixScript = pkg.scripts?.[CONFIG.lintFixScriptName]
            const targetLintFixScript = 'eslint . --fix'

            if (currentLintFixScript === targetLintFixScript) {
                logger.info(`\`${CONFIG.lintFixScriptName}\` script already configured correctly`)
                return pkg
            }

            if (currentLintFixScript) {
                logger.info(
                    `Skipping update. \`${CONFIG.lintFixScriptName}\` script already exists: "${currentLintFixScript}".`,
                )
                logger.info(`To update manually, set: "${targetLintFixScript}"`)
                return pkg
            }

            freshlyAdded = true
            return {
                ...pkg,
                scripts: { ...pkg.scripts, [CONFIG.lintFixScriptName]: targetLintFixScript },
            }
        })
        if (freshlyAdded)
            logger.success(`Added \`${CONFIG.lintFixScriptName}\` script to package.json`)
    } catch (error) {
        throw new Error(
            `Failed to update package.json with \`${CONFIG.lintFixScriptName}\` script`,
            { cause: error },
        )
    }
}

/**
 * Runs ESLint fix on the entire codebase.
 */
async function _runLintFix({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    try {
        const shouldFix = await confirmPrompt('Run ESLint --fix on the entire codebase now?')

        if (!shouldFix) {
            logger.info(
                `Skipping ESLint fix. Run \`${CONFIG.lintFixScriptName}\` script manually when ready.`,
            )
            return
        }

        logger.info('Running ESLint --fix...')
        await execa(packageManager, ['run', CONFIG.lintFixScriptName], { cwd, stdio: 'inherit' })
        logger.success('Codebase linted and fixed')
    } catch (error) {
        logger.error('Linting error occurred', { error })
        logger.warn(
            `Failed to lint codebase. You can run the \`${CONFIG.lintFixScriptName}\` script manually.`,
        )
    }
}

/**
 * Formats the newly created config file (just in case the formatting is off).
 */
async function _runFormatter({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    const configFileName = `eslint.config.${CONFIG.defaultConfigExtension}`
    const configPath = join(cwd, configFileName)

    try {
        logger.info(`Formatting ${configFileName}...`)
        await execa(packageManager, ['exec', 'prettier', '--write', configPath], {
            cwd,
            stdio: 'pipe',
        })
        logger.success(`${configFileName} formatted`)
    } catch (error) {
        // Non-critical: just log a warning if formatting fails
        logger.warn(`Failed to format ${configFileName}. You can format it manually.`)
        logger.debug('Formatting error:', { error })
    }
}

export async function setupEslint({ cwd }: { cwd: string }): Promise<void> {
    const shouldSetup = await confirmPrompt('Setup ESLint?')
    if (!shouldSetup) {
        logger.info('Skipping ESLint setup')
        return
    }

    const packageManager = await detect({ cwd })

    // 1. Install deps
    await _installDependencies({ cwd, packageManager })

    // 2. Delete any existing config files
    await _deleteExistingConfigs({ cwd })

    // 3. Copy the config file to the project root
    await _copyConfigFile({ cwd })

    // 4. Run the formatter on the config file
    await _runFormatter({ cwd, packageManager })

    // 5. Add `lint:fix` script to package.json
    await _addLintFixScript({ cwd })

    // 6. Run the `lint:fix` script
    await _runLintFix({ cwd, packageManager })
}
