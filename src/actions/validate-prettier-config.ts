import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ensureFileExists } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('validate-prettier-config')

/**
 * Validates that the provided Prettier config file exists and contains valid JSON.
 * Throws an error if validation fails.
 */
export async function validatePrettierConfig({
    configPath,
}: {
    configPath: string
}): Promise<void> {
    const resolvedPath = resolve(configPath)
    logger.info(`Validating Prettier config: ${resolvedPath}`)

    // Check if file exists
    await ensureFileExists(resolvedPath, `Prettier config file not found: ${resolvedPath}`)

    // Validate JSON content
    try {
        const content = await readFile(resolvedPath, 'utf-8')
        JSON.parse(content)
        logger.success('Prettier config is valid')
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in Prettier config file: ${resolvedPath}`, {
                cause: error,
            })
        }
        throw new Error('Failed to read Prettier config file', { cause: error })
    }
}
