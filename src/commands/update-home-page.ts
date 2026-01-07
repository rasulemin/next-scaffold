import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileExists } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('update-home-page')

const possiblePaths = ['src/app/page.tsx', 'app/page.tsx']
const newContents = `export default function HomePage() {
    return null
}
`

/**
 * Finds the home page file (page.tsx).
 * Checks both app/page.tsx and src/app/page.tsx.
 * Returns the full absolute path.
 */
async function _findHomePagePath(cwd: string): Promise<string | null> {
    for (const path of possiblePaths) {
        const fullPath = join(cwd, path)
        try {
            if (await fileExists(fullPath)) {
                logger.debug(`Found home page at: ${path}`)
                return fullPath
            }
        } catch (error) {
            logger.error(`Error accessing ${path}:`, { error })
            continue
        }
    }

    return null
}

/**
 * Replaces the home page content with a simple version.
 */
export async function updateHomePage({ cwd }: { cwd: string }): Promise<void> {
    logger.info('Updating home page...')

    const homePagePath = await _findHomePagePath(cwd)
    if (!homePagePath) {
        logger.warn(`Could not find home page file (${possiblePaths.join(', ')})`)
        return
    }

    try {
        await writeFile(homePagePath, newContents, 'utf-8')
        logger.success('Home page updated successfully')
    } catch (error) {
        logger.error('Failed to update home page. Please update it manually.', { error })
    }
}
