import axios from 'axios'

const HEROICC_API_URL = process.env.HEROICC_API_URL || 'https://api.heroi.cc'

interface HeroiccCard {
  id: string
  attributes: {
    card_number: string
    name: string
    color: string
    rarity: string
    type: string
    level?: number
    dp?: number
    play_cost?: number
    digivolve_cost?: string
    form?: string
    attribute?: string
    type_traits?: string[]
    main_effect?: string
    inherited_effect?: string
    artist?: string
    image_url?: string
  }
}

interface CardData {
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

export async function fetchBT23Cards(): Promise<CardData[]> {
  try {
    console.log('Fetching BT-23 cards from Heroicc API...')
    
    const response = await axios.get(`${HEROICC_API_URL}/releases/en/bt23`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'digimon-gacha/1.0'
      }
    })

    const cards = response.data.data as HeroiccCard[]
    
    return cards.map((card: HeroiccCard) => ({
      id: card.id,
      cardNumber: card.attributes.card_number,
      name: card.attributes.name,
      rarity: mapRarity(card.attributes.rarity),
      color: card.attributes.color || 'colorless',
      type: card.attributes.type || 'digimon',
      level: card.attributes.level || null,
      dp: card.attributes.dp || null,
      playCost: card.attributes.play_cost || null,
      digivolveCost: card.attributes.digivolve_cost || null,
      form: card.attributes.form || null,
      attribute: card.attributes.attribute || null,
      typeTraits: card.attributes.type_traits || [],
      mainEffect: card.attributes.main_effect || null,
      inheritedEffect: card.attributes.inherited_effect || null,
      artist: card.attributes.artist || null,
      imageUrl: card.attributes.image_url || generateImageUrl(card.attributes.card_number)
    }))
  } catch (error) {
    console.error('Error fetching BT-23 cards:', error)
    throw new Error('Failed to fetch cards from Heroicc API')
  }
}

function mapRarity(rarity: string): string {
  const rarityMap: Record<string, string> = {
    'c': 'common',
    'u': 'uncommon',
    'r': 'rare',
    'sr': 'super_rare',
    'sec': 'secret_rare'
  }
  
  return rarityMap[rarity.toLowerCase()] || rarity.toLowerCase()
}

function generateImageUrl(cardNumber: string): string {
  return `https://images.heroi.cc/cards/${cardNumber.toLowerCase()}.jpg`
}