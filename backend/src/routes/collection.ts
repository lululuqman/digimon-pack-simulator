import { Elysia } from 'elysia'
import { prisma } from '../lib/prisma'
import { sessionPlugin } from '../lib/session'

export const collectionRoutes = new Elysia({ prefix: '/api/collection' })
  .use(sessionPlugin)
  .get('/', async (context: any) => {
    const { sessionId } = context
    const collection = await prisma.sessionCard.findMany({
      where: { sessionId },
      include: { card: true },
      orderBy: { firstPull: 'desc' }
    })
    
    return {
      cards: collection.map((sc: any) => ({
        id: sc.card.id,
        cardNumber: sc.card.cardNumber,
        name: sc.card.name,
        rarity: sc.card.rarity,
        color: sc.card.color,
        type: sc.card.type,
        level: sc.card.level,
        dp: sc.card.dp,
        playCost: sc.card.playCost,
        digivolveCost: sc.card.digivolveCost,
        form: sc.card.form,
        attribute: sc.card.attribute,
        typeTraits: sc.card.typeTraits,
        mainEffect: sc.card.mainEffect,
        inheritedEffect: sc.card.inheritedEffect,
        artist: sc.card.artist,
        imageUrl: sc.card.imageUrl,
        quantity: sc.quantity,
        firstPull: sc.firstPull,
        lastPull: sc.lastPull
      })),
      total: collection.length
    }
  }, {
    detail: {
      tags: ['Collection'],
      summary: 'Get user collection',
      description: 'Returns all cards owned by the session'
    }
  })
  
  .get('/stats', async (context: any) => {
    const { sessionId } = context
    const totalCards = await prisma.card.count()
    const ownedCards = await prisma.sessionCard.count({
      where: { sessionId }
    })
    
    const collection = await prisma.sessionCard.findMany({
      where: { sessionId },
      include: { card: true }
    })
    
    const byRarity: Record<string, number> = {}
    const byColor: Record<string, number> = {}
    const byType: Record<string, number> = {}
    let totalDuplicates = 0
    
    for (const sc of collection) {
      const rarity = sc.card.rarity
      const color = sc.card.color
      const type = sc.card.type
      
      byRarity[rarity] = (byRarity[rarity] || 0) + 1
      byColor[color] = (byColor[color] || 0) + 1
      byType[type] = (byType[type] || 0) + 1
      
      if (sc.quantity > 1) {
        totalDuplicates += (sc.quantity - 1)
      }
    }
    
    const totalPulls = await prisma.pullHistory.count({
      where: { sessionId }
    })
    
    return {
      totalCards,
      ownedCards,
      completionPercentage: Math.round((ownedCards / totalCards) * 100),
      totalPulls,
      totalDuplicates,
      byRarity,
      byColor,
      byType
    }
  }, {
    detail: {
      tags: ['Collection'],
      summary: 'Get collection statistics',
      description: 'Returns detailed statistics about the user collection'
    }
  })
  
  .get('/missing', async (context: any) => {
    const { sessionId } = context
    const ownedCardIds = await prisma.sessionCard.findMany({
      where: { sessionId },
      select: { cardId: true }
    }).then((cards: any) => cards.map((c: any) => c.cardId))
    
    const missingCards = await prisma.card.findMany({
      where: {
        id: { notIn: ownedCardIds }
      },
      orderBy: { cardNumber: 'asc' }
    })
    
    return {
      cards: missingCards.map((c: any) => ({
        id: c.id,
        cardNumber: c.cardNumber,
        name: c.name,
        rarity: c.rarity,
        color: c.color,
        type: c.type,
        imageUrl: c.imageUrl
      })),
      total: missingCards.length
    }
  }, {
    detail: {
      tags: ['Collection'],
      summary: 'Get missing cards',
      description: 'Returns cards not yet in the collection'
    }
  })