import { detect, PM } from 'detect-package-manager'
import { execa } from 'execa'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { logger as _logger } from '../../lib/logger'
import { confirmPrompt } from '../../lib/prompt'

const logger = _logger.withTag('setup-eslint')

const CONFIG = {
    // Check for existing config in this order (Next.js creates .mjs by default)
    possibleConfigExtensions: ['mjs', 'js', 'cjs', 'ts', 'mts', 'cts'],
    // If no existing config found, create with this extension
    defaultConfigExtension: 'mjs',
    /**
     * @see https://github.com/antfu/eslint-config#manual-install
     * @see https://github.com/antfu/eslint-config#nextjs
     */
    requiredPackages: ['eslint', '@antfu/eslint-config', '@next/eslint-plugin-next'],
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
 * Detects the ESLint config file extension to use.
 * Checks for existing config in the root dir, otherwise returns default extension.
 */
async function _detectConfigExtension({ cwd }: { cwd: string }): Promise<string> {
    // Check all possible extensions
    for (const ext of CONFIG.possibleConfigExtensions) {
        try {
            await access(join(cwd, `eslint.config.${ext}`))
            logger.info(`Found existing eslint.config.${ext}`)
            return ext
        } catch {
            // Keep checking
            continue
        }
    }

    // No existing config found, use default
    const defaultExt = CONFIG.defaultConfigExtension
    logger.info(`No existing config found, will create eslint.config.${defaultExt}`)
    return defaultExt
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

    // 2. Detect which config ext to use
    const configExtension = await _detectConfigExtension({ cwd })

    // 3. copy the config file to the project root
    logger.info(`Config extension: ${configExtension}`)
    // 4. add new "lint:fix" script to package.json that runs "eslint --fix"
    // 5. run the "lint:fix" script
}
