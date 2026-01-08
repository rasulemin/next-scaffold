/**
 * These VS Code settings are recommended for the best IDE experience.
 * @see https://github.com/antfu/eslint-config
 */
export const ESLINT_CONFIG_TEMPLATE = `import antfu from '@antfu/eslint-config'

export default antfu(
    {
        nextjs: true,
        formatters: false,
        stylistic: false,
        lessOpinionated: true,
        typescript: true,
        jsx: true,
    },
    {
        rules: {
            'no-console': ['warn', { allow: ['info'] }],
            'antfu/no-top-level-await': 'off', // Allow top-level await
            'ts/consistent-type-definitions': ['error', 'type'], // Use \`type\` instead of \`interface\`
            'node/prefer-global/process': 'off', // Allow using \`process.env\`
            'unicorn/filename-case': [
                'error',
                {
                    case: 'kebabCase',
                    ignore: ['\\\\.md$', '\\\\.mdx$', '\\\\.json$'],
                },
            ],
            'jsx-a11y/media-has-caption': 'off', // Allow media without captions
            'ts/no-use-before-define': ['error', { functions: false }], // Allow using functions (components) before they are defined
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        // Example left for reference:
                        // {
                        //     name: 'react-error-boundary',
                        //     message:
                        //         'Please import from \`@/components/error-boundary\` instead.',
                        //     importNames: ['withErrorBoundary', 'ErrorBoundary'],
                        // },
                    ],
                },
            ],
            // Temporary fix for eslint-plugin-unicorn compatibility issue
            'unicorn/error-message': 'off',
        },
    },
)
`

export const VSCODE_SETTINGS_TEMPLATE = `{
    // Auto fix
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "always"
    },

    // Silent the stylistic rules in you IDE, but still auto fix them
    "eslint.rules.customizations": [
        { "rule": "style/*", "severity": "off", "fixable": true },
        { "rule": "format/*", "severity": "off", "fixable": true },
        { "rule": "*-indent", "severity": "off", "fixable": true },
        { "rule": "*-spacing", "severity": "off", "fixable": true },
        { "rule": "*-spaces", "severity": "off", "fixable": true },
        { "rule": "*-order", "severity": "off", "fixable": true },
        { "rule": "*-dangle", "severity": "off", "fixable": true },
        { "rule": "*-newline", "severity": "off", "fixable": true },
        { "rule": "*quotes", "severity": "off", "fixable": true },
        { "rule": "*semi", "severity": "off", "fixable": true }
    ],

    // Enable eslint for all supported languages
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
        "vue",
        "html",
        "markdown",
        "json",
        "json5",
        "jsonc",
        "yaml",
        "toml",
        "xml",
        "gql",
        "graphql",
        "astro",
        "svelte",
        "css",
        "less",
        "scss",
        "pcss",
        "postcss"
    ]
}
`
