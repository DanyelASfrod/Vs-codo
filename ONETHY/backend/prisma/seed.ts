import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('123456', 12)

  await prisma.user.upsert({
    where: { email: 'admin@onethy.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@onethy.com',
      password: passwordHash,
      company: 'ONETHY',
      role: 'admin'
    }
  })

  // Seed de planos padrão
  await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      priceCents: 9900,
      interval: 'month',
      features: { messages: 1000, support: 'básico' },
      active: true
    }
  })
  await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      priceCents: 19900,
      interval: 'month',
      features: { messages: 10000, support: 'prioritário' },
      active: true
    }
  })
  await prisma.plan.upsert({
    where: { name: 'Business' },
    update: {},
    create: {
      name: 'Business',
      priceCents: 49900,
      interval: 'month',
      features: { messages: 50000, support: 'dedicado' },
      active: true
    }
  })

  console.log('✅ Seed concluído: usuário admin@onethy.com / 123456 e planos padrão')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
