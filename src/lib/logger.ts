import { createConsola } from 'consola'

/**
 * @see https://github.com/unjs/consola
 */
export const logger = createConsola({
    level: Number(process.env.LOG_LEVEL) || 3,
})
