import { PrismaClient } from '@prisma/client'
import { fetchBT23Cards } from '../src/services/heroicc'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')
  
  // Check if cards already exist
  const existingCards = await prisma.card.count()
  
  if (existingCards > 0) {
    console.log(`⚠️  Database already contains ${existingCards} cards`)
    console.log('Deleting existing cards...')
    await prisma.card.deleteMany()
  }
  
  // Fetch cards from Heroicc API
  console.log('Fetching BT-23 cards from Heroicc API...')
  const cards = await fetchBT23Cards()
  
  console.log(`Found ${cards.length} cards`)
  
  // Insert cards
  console.log('Inserting cards into database...')
  
  for (const card of cards) {
    await prisma.card.create({
      data: card
    })
  }
  
  console.log(`✅ Successfully seeded ${cards.length} cards!`)
  
  // Show summary
  const summary = await prisma.card.groupBy({
    by: ['rarity'],
    _count: true
  })
  
  console.log('\n📊 Card Summary:')
  for (const { rarity, _count } of summary) {
    console.log(`  ${rarity}: ${_count}`)
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })