import { readFile, readdir, writeFile } from 'node:fs/promises'
import { optimize } from 'svgo'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const root = `${__dirname}/..`

const main = async () => {
  const iconsPath = join(root, 'icons')
  const dirents = await readdir(iconsPath)
  for (const dirent of dirents) {
    const iconPath = join(iconsPath, dirent)
    const content = await readFile(iconPath, 'utf8')
    const optimized = optimize(content).data
    if (optimized !== content) {
      await writeFile(iconPath, optimized)
    }
  }
}

main()
