import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from './env'

/**
 * Where uploaded files live. Routes only talk to this interface, so moving to
 * Vercel Blob means adding a driver here, not changing the API.
 */
export interface FileStorage {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<Uint8Array<ArrayBuffer> | null>
  delete(key: string): Promise<void>
}

/** Files on local disk under UPLOAD_DIR. Development only: serverless disks are temporary. */
function localStorage(root: string): FileStorage {
  const resolveKey = (key: string) => {
    const full = path.resolve(root, key)
    // Keys are server-generated, but refuse anything that escapes the upload folder.
    if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error(`Invalid storage key: ${key}`)
    return full
  }
  return {
    async put(key, data) {
      const full = resolveKey(key)
      await mkdir(path.dirname(full), { recursive: true })
      await writeFile(full, data)
    },
    async get(key) {
      try {
        return new Uint8Array(await readFile(resolveKey(key)))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
      }
    },
    async delete(key) {
      await rm(resolveKey(key), { force: true })
    },
  }
}

let storage: FileStorage | undefined

export function getStorage(): FileStorage {
  if (!storage) {
    const e = env()
    if (e.STORAGE_DRIVER === 'vercel-blob') {
      // TODO(blob): implement with @vercel/blob (put/head/del) when moving to Vercel.
      // Uploads should then go browser → Blob directly (client uploads), because Vercel
      // Functions accept request bodies up to 4.5 MB.
      throw new Error('STORAGE_DRIVER=vercel-blob is not implemented yet')
    }
    storage = localStorage(e.UPLOAD_DIR)
  }
  return storage
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // stays under Vercel's 4.5 MB function body limit
export const ALLOWED_UPLOAD_TYPES = /^(image\/(png|jpeg|webp|gif|heic|heif)|application\/pdf)$/
