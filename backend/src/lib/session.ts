import { Elysia } from 'elysia'
import { prisma } from './prisma'

export type SessionData = {
  id: string
  gems: number
  createdAt: Date
  lastPull: Date | null
}

export const sessionPlugin = new Elysia({ name: 'session' })
  .derive(async ({ cookie: { session_id }, set }) => {
    let sessionId = session_id as string | undefined
    let session: SessionData | null = null
    
    if (sessionId) {
      session = await prisma.session.findUnique({
        where: { id: sessionId }
      })
    }
    
    if (!session) {
      session = await prisma.session.create({
        data: {
          gems: 16000 // Generous starting amount for demo
        }
      })
      
      // Set cookie through set.cookie
      if (set.cookie) {
        set.cookie.session_id = {
          value: session.id,
          maxAge: 60 * 60 * 24 * 365, // 1 year
          httpOnly: true,
          sameSite: 'lax',
          path: '/'
        }
      }
      
      sessionId = session.id
    }
    
    return { sessionId: sessionId!, session: session! }
  })

