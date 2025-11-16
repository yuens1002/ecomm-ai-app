import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
import { prisma } from '../lib/prisma';

async function run() {
  const email = 'yuens1002@gmail.com';
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    console.log(`❌ No user found for email ${email}`);
    return;
  }
  const subs = await prisma.subscription.findMany({ where: { userId: user.id } });
  if (subs.length === 0) {
    console.log('✅ User has no subscriptions to delete');
    return;
  }
  const ids = subs.map(s => s.id);
  const deleted = await prisma.subscription.deleteMany({ where: { id: { in: ids } } });
  console.log(`🗑️ Deleted ${deleted.count} subscription(s) for user ${email}`);
}

run().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
