import { Elysia, t } from 'elysia'
import { prisma } from '../lib/prisma'
import { gachaEngine } from '../services/gacha-engine'
import { sessionPlugin } from '../lib/session'

const PACK_COST = 1000 // Cost per pack in gems

export const gachaRoutes = new Elysia({ prefix: '/api/gacha' })
  .use(sessionPlugin)
  .post('/pull', async (context: any) => {
    const { sessionId, session, set } = context
    // Check if user has enough gems
    if (session.gems < PACK_COST) {
      set.status = 400
      return {
        error: 'Insufficient gems',
        required: PACK_COST,
        current: session.gems
      }
    }
    
    // Deduct gems
    await prisma.session.update({
      where: { id: sessionId },
      data: { gems: { decrement: PACK_COST } }
    })
    
    // Pull pack
    const cards = await gachaEngine.pullPack(sessionId)
    
    // Get updated session
    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId }
    })
    
    return {
      cards,
      remainingGems: updatedSession?.gems || 0,
      packCost: PACK_COST
    }
  }, {
    detail: {
      tags: ['Gacha'],
      summary: 'Pull a single pack',
      description: 'Opens one booster pack (12 cards)'
    }
  })
  
  .post('/pull-multiple', async (context: any) => {
    const { sessionId, session, body, set } = context
    const { count } = body
    
    if (count < 1 || count > 10) {
      set.status = 400
      return { error: 'Count must be between 1 and 10' }
    }
    
    const totalCost = PACK_COST * count
    
    if (session.gems < totalCost) {
      set.status = 400
      return {
        error: 'Insufficient gems',
        required: totalCost,
        current: session.gems
      }
    }
    
    // Deduct gems
    await prisma.session.update({
      where: { id: sessionId },
      data: { gems: { decrement: totalCost } }
    })
    
    // Pull multiple packs
    const cards = await gachaEngine.pullMultiplePacks(sessionId, count)
    
    // Get updated session
    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId }
    })
    
    return {
      cards,
      packsOpened: count,
      remainingGems: updatedSession?.gems || 0,
      totalCost
    }
  }, {
    body: t.Object({
      count: t.Number({ minimum: 1, maximum: 10 })
    }),
    detail: {
      tags: ['Gacha'],
      summary: 'Pull multiple packs',
      description: 'Opens multiple booster packs at once (max 10)'
    }
  })
  
  .get('/history', async (context: any) => {
    const { sessionId, query } = context
    const limit = Math.min(parseInt(query.limit || '50'), 100)
    
    const history = await prisma.pullHistory.findMany({
      where: { sessionId },
      include: {
        card: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
    
    return {
      pulls: history.map((h: any) => ({
        id: h.id,
        card: {
          id: h.card.id,
          cardNumber: h.card.cardNumber,
          name: h.card.name,
          rarity: h.card.rarity,
          imageUrl: h.card.imageUrl
        },
        pullType: h.pullType,
        timestamp: h.timestamp
      })),
      total: history.length
    }
  }, {
    query: t.Object({
      limit: t.Optional(t.String())
    }),
    detail: {
      tags: ['Gacha'],
      summary: 'Get pull history',
      description: 'Returns recent pull history for the session'
    }
  })
  
  .get('/rates', () => {
    return {
      rates: {
        common: '58.3%',
        uncommon: '25.0%',
        rare: '14.6%',
        super_rare: '1.9%',
        secret_rare: '0.2%'
      },
      guarantees: {
        rare_or_better: '1 per pack',
        super_rare: '~1 per 3 packs',
        secret_rare: '~2 per box (24 packs)'
      },
      packCost: PACK_COST,
      cardsPerPack: 12
    }
  }, {
    detail: {
      tags: ['Gacha'],
      summary: 'Get pull rates',
      description: 'Returns gacha rates and guarantees'
    }
  })