import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const iconThemeUrl = new URL('../icon-theme.json', import.meta.url)

test('maps Zig files to the Zig icon', async () => {
  const iconTheme = JSON.parse(await readFile(iconThemeUrl, 'utf8'))
  const iconId = iconTheme.fileExtensions.zig
  const iconPath = iconTheme.iconDefinitions[iconId]

  assert.equal(iconId, '_f_zig')
  assert.equal(iconPath, '/icons/file_type_zig.svg')
  await assert.doesNotReject(
    readFile(new URL(`..${iconPath}`, import.meta.url)),
  )
})

for (const [fileName, iconType] of [
  ['Dockerfile', 'docker'],
  ['.env.sample', 'dotenv'],
]) {
  test(`maps ${fileName} to the ${iconType} icon without language contributions`, async () => {
    const iconTheme = JSON.parse(await readFile(iconThemeUrl, 'utf8'))
    const iconId = iconTheme.fileNames[fileName.toLowerCase()]
    const iconPath = iconTheme.iconDefinitions[iconId]

    assert.equal(iconId, `_f_${iconType}`)
    assert.equal(iconPath, `/icons/file_type_${iconType}.svg`)
    await assert.doesNotReject(readFile(new URL(`..${iconPath}`, import.meta.url)))
  })
}
