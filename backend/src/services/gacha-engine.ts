import { prisma } from '../lib/prisma'

// Rarity rates matching real BT-23 distributions
const RARITY_RATES = {
  common: 0.583,      // ~58.3% (7/12 cards)
  uncommon: 0.250,    // ~25.0% (3/12 cards)
  rare: 0.146,        // ~14.6% (1.75/12 cards)
  super_rare: 0.019,  // ~1.9% (~1 per 3 packs)
  secret_rare: 0.002  // ~0.2% (~2 per box)
}

const CARDS_PER_PACK = 12

export interface PulledCard {
  id: string
  cardNumber: string
  name: string
  rarity: string
  color: string
  type: string
  level: number | null
  dp: number | null
  imageUrl: string
  isNew: boolean
}

export class GachaEngine {
  async pullPack(sessionId: string): Promise<PulledCard[]> {
    const cards = await this.getCardPool()
    const pulledCards: PulledCard[] = []
    
    // Guaranteed at least 1 rare or better
    const guaranteedRare = this.selectCardByRarity(cards, ['rare', 'super_rare', 'secret_rare'])
    if (guaranteedRare) {
      pulledCards.push(await this.processPulledCard(sessionId, guaranteedRare))
    }
    
    // Pull remaining cards
    for (let i = pulledCards.length; i < CARDS_PER_PACK; i++) {
      const card = this.selectCardByRarity(cards)
      if (card) {
        pulledCards.push(await this.processPulledCard(sessionId, card))
      }
    }
    
    // Record pull history
    await this.recordPullHistory(sessionId, pulledCards, 'single_pack')
    
    return pulledCards
  }
  
  async pullMultiplePacks(sessionId: string, count: number): Promise<PulledCard[]> {
    const allCards: PulledCard[] = []
    
    for (let i = 0; i < count; i++) {
      const packCards = await this.pullPack(sessionId)
      allCards.push(...packCards)
    }
    
    return allCards
  }
  
  private async getCardPool() {
    return await prisma.card.findMany()
  }
  
  private selectCardByRarity(cards: any[], allowedRarities?: string[]) {
    const pool = allowedRarities 
      ? cards.filter(c => allowedRarities.includes(c.rarity))
      : cards
    
    if (pool.length === 0) return null
    
    if (allowedRarities) {
      // When specific rarities are requested, pick randomly from them
      return pool[Math.floor(Math.random() * pool.length)]
    }
    
    // Weighted random selection based on rarity rates
    const rand = Math.random()
    let cumulative = 0
    
    for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
      cumulative += rate
      if (rand <= cumulative) {
        const rarityPool = pool.filter(c => c.rarity === rarity)
        if (rarityPool.length > 0) {
          return rarityPool[Math.floor(Math.random() * rarityPool.length)]
        }
      }
    }
    
    // Fallback to random common
    const commons = pool.filter(c => c.rarity === 'common')
    return commons[Math.floor(Math.random() * commons.length)]
  }
  
  private async processPulledCard(sessionId: string, card: any): Promise<PulledCard> {
    // Check if card is new for this session
    const existingCard = await prisma.sessionCard.findUnique({
      where: {
        sessionId_cardId: {
          sessionId,
          cardId: card.id
        }
      }
    })
    
    const isNew = !existingCard
    
    // Add or update card in collection
    if (existingCard) {
      await prisma.sessionCard.update({
        where: { id: existingCard.id },
        data: {
          quantity: { increment: 1 },
          lastPull: new Date()
        }
      })
    } else {
      await prisma.sessionCard.create({
        data: {
          sessionId,
          cardId: card.id,
          quantity: 1
        }
      })
    }
    
    return {
      id: card.id,
      cardNumber: card.cardNumber,
      name: card.name,
      rarity: card.rarity,
      color: card.color,
      type: card.type,
      level: card.level,
      dp: card.dp,
      imageUrl: card.imageUrl,
      isNew
    }
  }
  
  private async recordPullHistory(sessionId: string, cards: PulledCard[], pullType: string) {
    await prisma.pullHistory.createMany({
      data: cards.map(card => ({
        sessionId,
        cardId: card.id,
        pullType
      }))
    })
    
    // Update session last pull time
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastPull: new Date() }
    })
  }
}

export const gachaEngine = new GachaEngine()