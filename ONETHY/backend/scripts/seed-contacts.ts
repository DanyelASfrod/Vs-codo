import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestContacts() {
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@onethy.com' } })
  
  if (!adminUser) {
    console.log('❌ Usuário admin não encontrado')
    return
  }

  // Criar contatos de teste
  const testContacts = [
    {
      userId: adminUser.id,
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@empresa.com',
      company: 'Tech Solutions Ltda',
      tags: ['cliente', 'vip'],
      status: 'active',
      source: 'whatsapp',
      totalMessages: 45
    },
    {
      userId: adminUser.id,
      name: 'Maria Santos',
      phone: '11888888888',
      email: 'maria@design.com',
      company: 'Design Studio',
      tags: ['prospect'],
      status: 'active',
      source: 'manual',
      totalMessages: 12
    },
    {
      userId: adminUser.id,
      name: 'Pedro Costa',
      phone: '11777777777',
      email: 'pedro@test.com',
      company: null,
      tags: ['suporte'],
      status: 'inactive',
      source: 'import',
      totalMessages: 3
    },
    {
      userId: adminUser.id,
      name: 'Ana Paula',
      phone: '11666666666',
      email: null,
      company: 'Marketing Plus',
      tags: ['cliente', 'vendas'],
      status: 'active',
      source: 'campaign',
      totalMessages: 28
    },
    {
      userId: adminUser.id,
      name: 'Carlos Oliveira',
      phone: '11555555555',
      email: 'carlos@exemplo.com',
      company: null,
      tags: ['prospect', 'vip'],
      status: 'blocked',
      source: 'whatsapp',
      totalMessages: 7
    }
  ]

  for (const contactData of testContacts) {
    await prisma.contact.create({
      data: contactData
    })
  }

  console.log('✅ Contatos de teste criados com sucesso!')
}

createTestContacts()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
