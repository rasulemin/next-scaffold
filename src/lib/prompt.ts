import { createInterface } from 'node:readline/promises'

/**
 * Prompts the user with a yes/no question.
 * Default is "yes" - pressing Enter confirms.
 */
export async function confirmPrompt(question: string): Promise<boolean> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const response = await rl.question(`${question} [Y/n]: `)
    rl.close()

    const yesses = ['y', 'yes', 'yep', 'yeah', 'yeeehhhaaaaa', 'ohyeah', 'sure', 'duh']
    return !response.trim() || yesses.includes(response.trim().toLowerCase())
}
