import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { getDb } from '../db/client'
import { files, symptoms, visits } from '../db/schema'
import { notFound, parse, pathId, type AppEnv } from '../http'
import { toAttachment } from '../mappers'
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, getStorage } from '../storage'

export const fileRoutes = new Hono<AppEnv>()

const uploadFieldsSchema = z.object({
  ownerType: z.enum(['visit', 'symptom']),
  ownerId: z.uuid(),
  kind: z.enum(['photo', 'receipt', 'file']).optional(),
})

/** Upload a photo/receipt (multipart: file, ownerType, ownerId, kind?) and attach it to a visit or symptom. */
fileRoutes.post(
  '/',
  bodyLimit({
    maxSize: MAX_UPLOAD_BYTES + 64 * 1024, // room for the multipart envelope
    onError: (c) => c.json({ error: 'File is too large (max 4 MB)' }, 413),
  }),
  async (c) => {
    const userId = c.get('userId')
    const body = await c.req.parseBody()
    const file = body['file']
    if (!(file instanceof File)) throw new HTTPException(400, { res: Response.json({ error: 'file: Required' }, { status: 400 }) })
    const fields = parse(uploadFieldsSchema, { ownerType: body['ownerType'], ownerId: body['ownerId'], kind: body['kind'] || undefined })

    if (file.size > MAX_UPLOAD_BYTES) return c.json({ error: 'File is too large (max 4 MB)' }, 413)
    if (!ALLOWED_UPLOAD_TYPES.test(file.type)) return c.json({ error: 'Only images and PDFs can be uploaded' }, 415)

    const db = getDb()
    const ownerTable = fields.ownerType === 'visit' ? visits : symptoms
    const [owner] = await db
      .select({ id: ownerTable.id })
      .from(ownerTable)
      .where(and(eq(ownerTable.id, fields.ownerId), eq(ownerTable.userId, userId)))
    if (!owner) throw notFound(`${fields.ownerType === 'visit' ? 'Visit' : 'Symptom entry'} not found`)

    const id = crypto.randomUUID()
    const storageKey = `${userId}/${id}`
    await getStorage().put(storageKey, new Uint8Array(await file.arrayBuffer()), file.type)

    const [row] = await db
      .insert(files)
      .values({
        id,
        userId,
        ownerType: fields.ownerType,
        ownerId: fields.ownerId,
        kind: fields.kind ?? (file.type.startsWith('image/') ? 'photo' : 'file'),
        name: (file.name || 'Upload').slice(0, 200),
        contentType: file.type,
        size: file.size,
        storageKey,
      })
      .returning()
    return c.json(toAttachment(row!), 201)
  },
)

/** Download a file. Only its owner can read it. */
fileRoutes.get('/:id', async (c) => {
  const id = pathId(c)
  const [row] = await getDb()
    .select()
    .from(files)
    .where(and(eq(files.id, id), eq(files.userId, c.get('userId'))))
  if (!row?.storageKey) throw notFound('File not found')

  const data = await getStorage().get(row.storageKey)
  if (!data) throw notFound('File not found')
  return new Response(data, {
    headers: {
      'Content-Type': row.contentType ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.name)}`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})
