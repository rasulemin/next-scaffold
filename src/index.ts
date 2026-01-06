import { join } from 'node:path'
import { ensureNextJsProject } from './actions/ensure-nextjs-project'

// const cwd = process.cwd()
const cwd = join(process.cwd(), '../')

function main() {
    ensureNextJsProject({ cwd })
}

main()
