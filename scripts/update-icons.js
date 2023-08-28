import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import jsonfile from 'jsonfile'
import got from 'got'
import fsExtra from 'fs-extra'
import extractZip from 'extract-zip'
import VError from 'verror'

const VERSION = '12.5.0'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outFileZip = resolve(__dirname, `../.tmp/extension-${VERSION}.zip`)
const outDir = resolve(__dirname, '../.tmp/extension')

const download = async (url, outFile) => {
  try {
    await mkdir(dirname(outFile), { recursive: true })
    await pipeline(got.stream(url), createWriteStream(outFile))
  } catch (error) {
    console.log({ error })
    try {
      await rm(outFile)
    } catch {
      // ignore
    }

    // @ts-ignore
    throw new VError(error, `failed to download ${url}`)
  }
}

const downloadExtension = async () => {
  if (existsSync(outFileZip)) {
    console.info('[download skipped]')
    return
  }

  await download(
    `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/vscode-icons-team/vsextensions/vscode-icons/${VERSION}/vspackage`,
    outFileZip,
  )
}

const unzip = async (inFile, outDir) => {
  try {
    await mkdir(outDir, { recursive: true })
    await extractZip(inFile, { dir: outDir })
  } catch (error) {
    // @ts-ignore
    throw new VError(error, `Failed to unzip "${inFile}"`)
  }
}

const extractExtension = async () => {
  await unzip(outFileZip, outDir)
}

const adjustJson = (json) => {
  const iconDefinitions = Object.fromEntries(
    Object.entries(json.iconDefinitions).map(([key, value]) => [
      key,
      value.iconPath.slice(5),
    ]),
  )
  const fileNames = json.fileNames
  const folderNames = json.folderNames
  const folderNamesExpanded = json.folderNamesExpanded
  const fileExtensions = json.fileExtensions
  const languageIds = json.languageIds
  if (languageIds['javascriptreact']) {
    languageIds['jsx'] = languageIds['javascriptreact']
  }
  if (languageIds['typescriptreact']) {
    languageIds['tsx'] = languageIds['typescriptreact']
  }
  return {
    iconDefinitions,
    fileNames,
    folderNames,
    folderNamesExpanded,
    fileExtensions,
    languageIds,
  }
}

const generateIconJson = async () => {
  const originalJson = await jsonfile.readFile(
    resolve(
      __dirname,
      '..',
      '.tmp',
      'extension',
      'extension',
      'dist',
      'src',
      'vsicons-icon-theme.json',
    ),
  )
  const adjustedJson = adjustJson(originalJson)
  await jsonfile.writeFile(
    resolve(__dirname, '..', 'icon-theme.json'),
    adjustedJson,
    {
      spaces: 2,
    },
  )
}

const copy = async (source, destination) => {
  try {
    await fsExtra.copy(source, destination)
  } catch (error) {
    // @ts-ignore
    throw new VError(error, `failed to copy ${source} to ${destination}`)
  }
}

const copyIcons = async () => {
  await copy(
    resolve(__dirname, '..', '.tmp', 'extension', 'extension', 'icons'),
    resolve(__dirname, '..', 'icons'),
  )
}

const printError = (error) => {
  if (
    error &&
    error instanceof Error &&
    error.message.includes('Response code 429')
  ) {
    console.error(error.message)
  } else {
    console.error(error)
  }
}

const main = async () => {
  try {
    console.time('downloadExtension')
    await downloadExtension()
    console.timeEnd('downloadExtension')

    console.time('extractExtension')
    await extractExtension()
    console.timeEnd('extractExtension')

    console.time('generateIconJson')
    await generateIconJson()
    console.timeEnd('generateIconJson')

    console.time('copyIcons')
    await copyIcons()
    console.timeEnd('copyIcons')
  } catch (error) {
    printError(error)
    process.exit(1)
  }
}

main()
