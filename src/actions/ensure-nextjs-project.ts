import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('ensure-nextjs-project')

interface PackageJson {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}

/**
 * This is a helper function to ensure the user is in a Next.js project before running any commands.
 * Exits the process with an error if it isn't.
 */
export function ensureNextJsProject({ cwd }: { cwd: string }): void {
    // Check if package.json exists
    const packageJsonPath = join(cwd, 'package.json')
    logger.debug(`Checking if package.json exists at ${packageJsonPath}`)
    if (!existsSync(packageJsonPath)) {
        logger.error('No package.json found in the current directory.')
        process.exit(1)
    }

    // Read and parse package.json
    let packageJson: PackageJson
    try {
        const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
        packageJson = JSON.parse(packageJsonContent)
    } catch (error) {
        logger.error('Failed to read or parse package.json', { error })
        process.exit(1)
    }

    const message = "This doesn't appear to be a Next.js project"

    // Check if dep is installed
    const hasDependency =
        (packageJson.dependencies && 'next' in packageJson.dependencies) ||
        (packageJson.devDependencies && 'next' in packageJson.devDependencies)
    logger.debug(`Checking if 'next' dependency is installed: ${hasDependency}`)
    if (!hasDependency) {
        logger.error(`${message}: missing 'next' dependency`)
        process.exit(1)
    }

    // Check for next config file
    const nextConfigFiles = [
        'next.config.js',
        'next.config.mjs',
        'next.config.ts',
        'next.config.cjs',
    ]

    const hasNextConfig = nextConfigFiles.some((file) => existsSync(join(cwd, file)))
    logger.debug(`Checking if next config file exists: ${hasNextConfig}`)
    if (!hasNextConfig) {
        logger.error(`${message}: missing next.config.* file`)
        process.exit(1)
    }

    logger.success('Next.js project detected')
}
