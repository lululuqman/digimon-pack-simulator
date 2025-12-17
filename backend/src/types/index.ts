import { Prisma } from '@prisma/client'

export type Session = {
  id: string
  gems: number
  createdAt: Date
  lastPull: Date | null
}

export type Card = {
  id: string
  cardNumber: string
  name: string
  rarity: string
  color: string
  type: string
  level: number | null
  dp: number | null
  playCost: number | null
  digivolveCost: string | null
  form: string | null
  attribute: string | null
  typeTraits: string[]
  mainEffect: string | null
  inheritedEffect: string | null
  artist: string | null
  imageUrl: string
}

export interface SessionWithCards extends Session {
  cards?: SessionCardWithCard[]
}

export interface SessionCardWithCard {
  id: string
  sessionId: string
  cardId: string
  quantity: number
  firstPull: Date
  lastPull: Date
  card: Card
}

export interface PullResult {
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

export interface CollectionStats {
  totalCards: number
  ownedCards: number
  completionPercentage: number
  totalPulls: number
  totalDuplicates: number
  byRarity: Record<string, number>
  byColor: Record<string, number>
  byType: Record<string, number>
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'super_rare' | 'secret_rare'
export type Color = 'red' | 'blue' | 'yellow' | 'green' | 'black' | 'purple' | 'white' | 'colorless'
export type CardType = 'digimon' | 'tamer' | 'option'
export type PullType = 'single_pack' | 'triple_pack' | 'ten_pack'