import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDirectory = fileURLToPath(new URL('../../data/', import.meta.url))
const collectionLocks = new Map()
const collections = ['admins', 'students', 'courses', 'applications', 'leaves']

function collectionPath(collection) {
  return join(dataDirectory, `${collection}.json`)
}

export async function readCollection(collection) {
  const path = collectionPath(collection)
  await mkdir(dirname(path), { recursive: true })

  try {
    const contents = await readFile(path, 'utf8')
    const records = JSON.parse(contents)
    if (!Array.isArray(records)) throw new Error(`${collection}.json must contain an array`)
    return records
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await writeFile(path, '[]\n', { flag: 'wx' }).catch((writeError) => {
      if (writeError.code !== 'EEXIST') throw writeError
    })
    return []
  }
}

export async function initializeDataFiles() {
  await Promise.all(collections.map((collection) => readCollection(collection)))
}

export async function writeCollection(collection, records) {
  return withCollectionLock(collection, () => writeCollectionFile(collection, records))
}

export async function updateCollection(collection, updater) {
  return withCollectionLock(collection, async () => {
    const records = await readCollection(collection)
    const result = await updater(records)
    await writeCollectionFile(collection, records)
    return result
  })
}

async function withCollectionLock(collection, operation) {
  const path = collectionPath(collection)
  const previous = collectionLocks.get(path) || Promise.resolve()
  let release
  const current = new Promise((resolve) => { release = resolve })
  const queued = previous.then(() => current)
  collectionLocks.set(path, queued)
  await previous

  try {
    return await operation()
  } finally {
    release()
    if (collectionLocks.get(path) === queued) collectionLocks.delete(path)
  }
}

async function writeCollectionFile(collection, records) {
  const path = collectionPath(collection)
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, { mode: 0o600 })
  await rename(temporaryPath, path)
}
