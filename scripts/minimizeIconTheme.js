import { copyFiles, packageExtension } from '@lvce-editor/package-extension'
import { readFile, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const root = path.join(__dirname, '..')

const readJson = async (path) => {
  const file = await readFile(path, 'utf8')
  console.time('parse')
  const json = JSON.parse(file)
  console.timeEnd('parse')
  return json
}
const writeJson = async (path, json) => {
  const content = JSON.stringify(json, null, 2) + '\n'
  await writeFile(path, content)
}
const writeJsonMin = async (path, json) => {
  const content = JSON.stringify(json) + '\n'
  await writeFile(path, content)
}

const minimizeMap = (map, reverseMap) => {
  const resultFileNames = Object.create(null)
  for (const key of Object.keys(map)) {
    resultFileNames[key] = reverseMap[map[key]]
  }
  return resultFileNames
}

const minimize = (json) => {
  const definitions = json.iconDefinitions
  const reverseMap = Object.create(null)
  const array = []
  let i = 0
  for (const [key, value] of Object.entries(definitions)) {
    array.push(value)
    reverseMap[key] = i++
  }
  const fileNames = json.fileNames
  const resultFileNames = minimizeMap(fileNames, reverseMap)
  const folderNames = json.folderNames
  const resultFolderNames = minimizeMap(folderNames, reverseMap)
  const fileExtensions = json.folderNames
  const resultFileExtensions = minimizeMap(fileExtensions, reverseMap)
  const languageIds = json.languageIds
  const resultLanguageIds = minimizeMap(languageIds, reverseMap)
  return {
    iconDefinitions: array,
    fileNames: resultFileNames,
    folderNames: resultFolderNames,
    fileExtensions: resultFileExtensions,
    languageIds: resultLanguageIds,
  }
}

const minimizeIconTheme = async () => {
  const path = join(root, 'icon-theme.json')
  const pathMinified = join(root, 'icon-theme-minified.json')
  const pathMinified2 = join(root, 'icon-theme-minified.min.json')
  const path2 = join(root, 'icon-theme.min.json')
  const json = await readJson(path)
  const minimized = minimize(json)
  await writeJson(pathMinified, minimized)
  await writeJsonMin(path2, json)
  await writeJsonMin(pathMinified2, minimized)

  for (let i = 0; i < 10; i++) {
    await readJson(path)
    await readJson(pathMinified)
    await readJson(path2)
    await readJson(pathMinified2)
    console.log('')
  }
}

const main = async () => {
  await minimizeIconTheme()
}

main()
