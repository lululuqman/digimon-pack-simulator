import { Elysia } from 'elysia'
import { prisma } from '../lib/prisma'
import { sessionPlugin } from '../lib/session'

export const sessionRoutes = new Elysia({ prefix: '/api' })
  .use(sessionPlugin)
  .get('/session', (context: any) => {
    const { session } = context
    return {
      id: session.id,
      gems: session.gems,
      createdAt: session.createdAt,
      lastPull: session.lastPull
    }
  }, {
    detail: {
      tags: ['Session'],
      summary: 'Get or create session',
      description: 'Returns current session or creates a new one'
    }
  })
  
  .post('/session/reset', async (context: any) => {
    const { session, set } = context
    // Delete old session
    await prisma.session.delete({
      where: { id: session.id }
    })
    
    // Create new session
    const newSession = await prisma.session.create({
      data: {
        gems: 16000
      }
    })
    
    // Set cookie through set.cookie
    if (set.cookie) {
      set.cookie.session_id = {
        value: newSession.id,
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      }
    }
    
    return {
      message: 'Session reset successfully',
      session: {
        id: newSession.id,
        gems: newSession.gems,
        createdAt: newSession.createdAt
      }
    }
  }, {
    detail: {
      tags: ['Session'],
      summary: 'Reset session',
      description: 'Deletes current session and creates a new one'
    }
  })