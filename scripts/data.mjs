import { readFile, writeFile } from 'node:fs/promises'

export async function readData(file) {
  return JSON.parse(await readFile(new URL('../public/data/' + file, import.meta.url), 'utf8'))
}

export function writeData(file, data) {
  return writeFile(new URL('../public/data/' + file, import.meta.url), JSON.stringify(data, null, 2) + '\n')
}
