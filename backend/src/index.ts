import { Elysia } from 'elysia'
import { cookie } from '@elysiajs/cookie'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { sessionRoutes } from './routes/session.ts'
import { gachaRoutes } from './routes/gacha.ts'
import { cardRoutes } from './routes/cards.ts'
import { collectionRoutes } from './routes/collection.ts'

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }))
  .use(cookie())
  .use(swagger({
    documentation: {
      info: {
        title: 'Digimon TCG BT-23 Gacha API',
        version: '1.0.0',
        description: 'API for Digimon Card Game BT-23: Hackers\' Slumber gacha simulator'
      },
      tags: [
        { name: 'Session', description: 'Session management' },
        { name: 'Gacha', description: 'Pack pulling mechanics' },
        { name: 'Cards', description: 'Card catalog' },
        { name: 'Collection', description: 'User collection' }
      ]
    }
  }))
  
  // Health check
  .get('/', () => ({
    message: 'Digimon TCG BT-23 Gacha API',
    version: '1.0.0',
    docs: '/swagger'
  }))
  
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  
  // Routes - sessionRoutes must come first as it provides derive for others
  .use(sessionRoutes)
  .use(cardRoutes)
  .use(gachaRoutes)
  .use(collectionRoutes)
  
  .listen(process.env.PORT || 3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
console.log(`📚 API Documentation: http://${app.server?.hostname}:${app.server?.port}/swagger`)