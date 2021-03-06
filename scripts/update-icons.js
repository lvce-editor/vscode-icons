import extractZip from 'extract-zip'
import { createWriteStream, existsSync } from 'fs'
import fsExtra from 'fs-extra'
import { mkdir, rm } from 'fs/promises'
import got from 'got'
import jsonfile from 'jsonfile'
import { dirname, resolve } from 'path'
import { pipeline } from 'stream/promises'
import { fileURLToPath } from 'url'
import VError from 'verror'

const VERSION = '11.12.0'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outFileZip = resolve(__dirname, '../.tmp/extension.zip')
const outDir = resolve(__dirname, '../.tmp/extension')

const download = async (url, outFile) => {
  try {
    await mkdir(dirname(outFile), { recursive: true })
    await pipeline(got.stream(url), createWriteStream(outFile))
  } catch (error) {
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
    outFileZip
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
    Object.entries(json.iconDefinitions).map(([key, value]) => {
      return [key, value.iconPath.slice(5)]
    })
  )
  const fileNames = json.fileNames
  const folderNames = json.folderNames
  const folderNamesExpanded = json.folderNamesExpanded
  const fileExtensions = json.fileExtensions
  const languageIds = json.languageIds
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
      'vsicons-icon-theme.json'
    )
  )
  const adjustedJson = adjustJson(originalJson)
  await jsonfile.writeFile(
    resolve(__dirname, '..', 'icon-theme.json'),
    adjustedJson,
    {
      spaces: 2,
    }
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
    resolve(__dirname, '..', 'icons')
  )
}

const main = async () => {
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
}

main()
