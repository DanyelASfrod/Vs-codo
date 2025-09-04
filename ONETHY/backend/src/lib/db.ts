import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()
export const db = prisma // Export db for compatibility

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
