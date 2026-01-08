import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { copyFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileExists } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'
import { hasPackage, readPackageJson, updatePackageJsonScripts } from '../lib/package-json'

const logger = _logger.withTag('prettier-command')

const DEFAULT_PRETTIER_CONFIG = `{
    "singleQuote": true,
    "semi": false,
    "tabWidth": 4
}
`

/**
 * Creates Prettier config file in the project root.
 * Uses custom config if provided, otherwise uses built-in default config.
 * Skips if a config file already exists (unless custom config is provided).
 */
async function _createConfigFile({
    cwd,
    customConfigPath,
}: {
    cwd: string
    customConfigPath?: string
}): Promise<void> {
    const targetConfigPath = join(cwd, '.prettierrc')
    const configExists = await fileExists(targetConfigPath)

    // If config already exists and no custom config provided, skip
    if (configExists && !customConfigPath) {
        logger.info('Prettier config file already exists')
        return
    }

    // If config exists but user provided custom config, warn about overwriting
    if (configExists && customConfigPath) {
        logger.warn('Prettier config file already exists, overwriting with custom config')
    }

    try {
        if (customConfigPath) {
            // Copy custom config file from user-provided path
            logger.info(`Using custom Prettier config from: ${customConfigPath}`)
            await copyFile(customConfigPath, targetConfigPath)
        } else {
            // Write default config from template
            logger.info('Using built-in Prettier config')
            await writeFile(targetConfigPath, DEFAULT_PRETTIER_CONFIG, 'utf-8')
        }
        logger.success('Prettier config file created')
    } catch (error) {
        throw new Error('Failed to create Prettier config file', {
            cause: error,
        })
    }
}

/**
 * Checks if Prettier is installed and installs it as a dev dependency if not.
 */
async function _ensurePrettierInstalled({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    try {
        const packageJsonContents = await readPackageJson(cwd)
        if (hasPackage(packageJsonContents, 'prettier')) {
            logger.info('Prettier already installed')
            return
        }
    } catch (error) {
        throw new Error('Failed to check if Prettier is installed', {
            cause: error,
        })
    }

    logger.info('Installing Prettier')
    const action = packageManager === 'npm' ? 'install' : 'add'
    try {
        await execa(packageManager, [action, '-D', 'prettier'], {
            cwd,
            stdio: 'inherit',
        })
        logger.success('Prettier installed')
    } catch (error) {
        throw new Error('Failed to install Prettier', { cause: error })
    }
}

/**
 * Adds a "format" script to package.json if it doesn't exist.
 * Skips if a format script is already configured.
 */
async function _addFormatScriptToPackageJson({ cwd }: { cwd: string }): Promise<void> {
    try {
        let freshlyAdded = false
        await updatePackageJsonScripts(cwd, (scripts) => {
            const currentFormatScript = scripts.format
            const targetFormatScript = 'prettier . --write'

            if (currentFormatScript === targetFormatScript) {
                logger.info('Format script already configured correctly')
                return scripts
            }

            if (currentFormatScript) {
                logger.info(
                    `Skipping update. Format script already exists: "${currentFormatScript}".`,
                )
                logger.info(`To update manually, set: "${targetFormatScript}"`)
                return scripts
            }

            freshlyAdded = true
            return {
                ...scripts,
                format: targetFormatScript,
            }
        })
        if (freshlyAdded) logger.success('Added format script to package.json')
    } catch (error) {
        throw new Error('Failed to update package.json with format script', {
            cause: error,
        })
    }
}

/**
 * Prompts the user to format the entire codebase.
 * Runs the "format" script if confirmed (default: yes).
 */
async function _formatCodebase({
    cwd,
    packageManager,
}: {
    cwd: string
    packageManager: PM
}): Promise<void> {
    try {
        logger.info('Formatting codebase...')
        await execa(packageManager, ['run', 'format'], {
            cwd,
            stdio: 'inherit',
        })
        logger.success('Codebase formatted')
    } catch (error) {
        logger.error('Formatting error occurred', { error })
        logger.warn('Failed to format codebase. You can run the `format` script manually.')
    }
}

/**
 * Main function to set up Prettier in a Next.js project.
 */
export async function setupPrettier({
    cwd,
    prettierConfigPath,
    dryRun = false,
}: {
    cwd: string
    prettierConfigPath?: string
    dryRun?: boolean
}): Promise<void> {
    if (dryRun) {
        logger.info('Would set up Prettier:')
        logger.info('  - Copy Prettier config file')
        logger.info('  - Install Prettier (if not installed)')
        logger.info('  - Add format script to package.json')
        logger.info('  - Format entire codebase')
        return
    }

    logger.info('Setting up Prettier')
    await _createConfigFile({ cwd, customConfigPath: prettierConfigPath })
    const pm = await detect({ cwd })
    await _ensurePrettierInstalled({ cwd, packageManager: pm })
    await _addFormatScriptToPackageJson({ cwd })
    await _formatCodebase({ cwd, packageManager: pm })
}
