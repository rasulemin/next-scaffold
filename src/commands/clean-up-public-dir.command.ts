import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { isNodeError } from '../lib/helpers'
import { logger as _logger } from '../lib/logger'

const logger = _logger.withTag('cleanup-public')

/**
 * Deletes default Next.js SVG files from the public directory.
 * Only removes .svg files (file.svg, globe.svg, next.svg, vercel.svg, window.svg).
 */
export async function cleanUpPublicDir({ cwd }: { cwd: string }): Promise<void> {
    const publicDir = join(cwd, 'public')

    try {
        logger.info('Removing default SVG files from public directory')

        const files = await readdir(publicDir)
        const svgFiles = files.filter((file) => file.endsWith('.svg'))

        if (svgFiles.length === 0) {
            logger.info('No SVG files found in public directory')
            return
        }

        // Delete SVG files in parallel
        const results = await Promise.allSettled(
            svgFiles.map((file) => unlink(join(publicDir, file))),
        )

        // Count successes and failures
        const removed = results.filter((r) => r.status === 'fulfilled').length
        const failed = results.filter((r) => r.status === 'rejected').length

        if (removed > 0) {
            logger.success(`Removed ${removed} SVG file(s) from public directory`)
        }
        if (failed > 0) {
            logger.warn(`Failed to remove ${failed} SVG file(s)`)
        }
    } catch (error) {
        if (isNodeError(error) && error.code === 'ENOENT') {
            logger.info('Public directory does not exist')
            return
        }
        logger.warn('Failed to clean up public directory', { error })
    }
}
