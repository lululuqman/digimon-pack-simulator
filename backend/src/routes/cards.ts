import { Elysia, t } from 'elysia'
import { prisma } from '../lib/prisma'

export const cardRoutes = new Elysia({ prefix: '/api/cards' })
  .get('/', async ({ query }) => {
    const { rarity, color, type, search } = query
    
    const where: any = {}
    
    if (rarity) where.rarity = rarity
    if (color) where.color = color
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cardNumber: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const cards = await prisma.card.findMany({
      where,
      orderBy: { cardNumber: 'asc' }
    })
    
    return {
      cards: cards.map((c: any) => ({
        id: c.id,
        cardNumber: c.cardNumber,
        name: c.name,
        rarity: c.rarity,
        color: c.color,
        type: c.type,
        level: c.level,
        dp: c.dp,
        playCost: c.playCost,
        imageUrl: c.imageUrl
      })),
      total: cards.length
    }
  }, {
    query: t.Object({
      rarity: t.Optional(t.String()),
      color: t.Optional(t.String()),
      type: t.Optional(t.String()),
      search: t.Optional(t.String())
    }),
    detail: {
      tags: ['Cards'],
      summary: 'Get all cards',
      description: 'Returns card catalog with optional filters'
    }
  })
  
  .get('/:id', async ({ params: { id }, set }) => {
    const card = await prisma.card.findUnique({
      where: { id }
    })
    
    if (!card) {
      set.status = 404
      return { error: 'Card not found' }
    }
    
    return { card }
  }, {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Cards'],
      summary: 'Get card by ID',
      description: 'Returns detailed information for a specific card'
    }
  })
  
  .get('/stats/summary', async () => {
    const total = await prisma.card.count()
    
    const byRarity = await prisma.card.groupBy({
      by: ['rarity'],
      _count: true
    })
    
    const byColor = await prisma.card.groupBy({
      by: ['color'],
      _count: true
    })
    
    const byType = await prisma.card.groupBy({
      by: ['type'],
      _count: true
    })
    
    return {
      total,
      byRarity: Object.fromEntries(
        byRarity.map((r: any) => [r.rarity, r._count])
      ),
      byColor: Object.fromEntries(
        byColor.map((c: any) => [c.color, c._count])
      ),
      byType: Object.fromEntries(
        byType.map((t: any) => [t.type, t._count])
      )
    }
  }, {
    detail: {
      tags: ['Cards'],
      summary: 'Get card statistics',
      description: 'Returns summary statistics for the card catalog'
    }
  })