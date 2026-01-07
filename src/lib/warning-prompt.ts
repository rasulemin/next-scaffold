import { createInterface } from 'node:readline/promises'

/**
 * Prompts the user with a yes/no question.
 * Default is "no" - pressing Enter declines.
 * User must explicitly type a "yes" variant to proceed.
 */
export async function warningPrompt(): Promise<boolean> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const question =
        '⚠️  This script is intended for FRESHLY CREATED Next.js projects.\n\n' +
        'It will:\n' +
        '  • Install and configure Prettier\n' +
        '  • Install and configure ESLint (antfu/eslint-config)\n' +
        '  • Clean up public directory (remove default SVGs)\n' +
        '\nContinue?'

    const response = await rl.question(`${question} [N/y]: `)
    rl.close()

    const trimmed = response.trim().toLowerCase()
    const yesses = ['y', 'yes', 'yep', 'yeah', 'yeeehhhaaaaa', 'ohyeah', 'sure', 'duh']

    // Default to NO if empty, or if not in yesses list
    return trimmed !== '' && yesses.includes(trimmed)
}
