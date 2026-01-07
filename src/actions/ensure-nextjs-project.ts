import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('ensure-nextjs-project')

const NEXT_CONFIG_FILES = ['next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs']

interface PackageJson {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}

/**
 * This is a helper function to ensure the user is in a Next.js project before running any commands.
 * Exits the process with an error if it isn't.
 */
export async function ensureNextJsProject({ cwd }: { cwd: string }): Promise<void> {
    // Check if package.json exists
    const packageJsonPath = join(cwd, 'package.json')
    logger.debug(`Checking if package.json exists at ${packageJsonPath}`)

    try {
        const contents = await readFile(packageJsonPath, 'utf-8')
        const contentsJson = JSON.parse(contents) as PackageJson
        const message = "This doesn't appear to be a Next.js project"

        // Check if dep is installed
        const hasDependency =
            (contentsJson.dependencies && 'next' in contentsJson.dependencies) ||
            (contentsJson.devDependencies && 'next' in contentsJson.devDependencies)
        logger.debug(`Checking if 'next' dependency is installed: ${hasDependency}`)
        if (!hasDependency) {
            logger.error(`${message}: missing 'next' dependency`)
            process.exit(1)
        }

        // Check for next config file
        const hasNextConfig = NEXT_CONFIG_FILES.some((file) => existsSync(join(cwd, file)))
        logger.debug(`Checking if next config file exists: ${hasNextConfig}`)
        if (!hasNextConfig) {
            logger.error(`${message}: missing next.config.* file`)
            process.exit(1)
        }

        logger.success('Next.js project detected')
    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            logger.error('No package.json found in the current directory.')
        } else {
            logger.error('Failed to read package.json file', { error: err })
        }
        process.exit(1)
    }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && 'code' in error
}
