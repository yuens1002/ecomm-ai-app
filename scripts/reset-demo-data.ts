/**
 * Wipes all orders, subscriptions, user activities, and newsletter subscribers
 * from the database, then reseeds with randomized synthetic data.
 *
 * Usage:  npm run reset:demo
 *         npx tsx dev-tools/reset-demo-data.ts
 */
import { prisma } from '../lib/prisma'
import { seedSyntheticData } from '../prisma/seed/synthetic-data'

async function main() {
  console.log('🧹 Resetting demo data...\n')

  // --- Wipe real user data ---
  const orders = await prisma.order.count()
  const subs = await prisma.subscription.count()
  const activities = await prisma.userActivity.count()
  const subscribers = await prisma.newsletterSubscriber.count()

  console.log(`  Found: ${orders} orders, ${subs} subscriptions, ${activities} activities, ${subscribers} subscribers`)

  await prisma.order.deleteMany()
  console.log('  ✓ Deleted all orders (+ items cascade)')

  await prisma.subscription.deleteMany()
  console.log('  ✓ Deleted all subscriptions')

  await prisma.userActivity.deleteMany()
  console.log('  ✓ Deleted all user activities')

  await prisma.newsletterSubscriber.deleteMany()
  console.log('  ✓ Deleted all newsletter subscribers')

  // --- Reseed with synthetic data ---
  console.log('')
  await seedSyntheticData(prisma)

  console.log('\n✅ Demo data reset complete!')
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
