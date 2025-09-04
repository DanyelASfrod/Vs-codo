import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed completo...')

  // Limpar dados existentes
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.macro.deleteMany()
  await prisma.user.deleteMany()
  await prisma.team.deleteMany()
  await prisma.channel.deleteMany()

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('123456', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Onethy',
      email: 'admin@onethy.com',
      password: hashedPassword,
      role: 'admin',
      company: 'Onethy SaaS',
      status: 'active',
    }
  })

  // Criar equipe
  const team = await prisma.team.create({
    data: {
      name: 'Suporte Geral',
      description: 'Equipe de atendimento ao cliente',
    }
  })

  // Atualizar usuário para fazer parte da equipe
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { teamId: team.id }
  })

  // Criar contatos
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'João Silva',
        phone: '+5511999887766',
        email: 'joao@empresa.com',
        userId: adminUser.id,
      }
    }),
    prisma.contact.create({
      data: {
        name: 'Maria Santos',
        phone: '+5511888776655',
        email: 'maria@empresa.com',
        userId: adminUser.id,
      }
    }),
    prisma.contact.create({
      data: {
        name: 'Carlos Oliveira',
        phone: '+5511777665544',
        userId: adminUser.id,
      }
    })
  ])

  // Criar canais primeiro
  const whatsappChannel = await prisma.channel.create({
    data: {
      name: 'WhatsApp Oficial',
      type: 'whatsapp',
      userId: adminUser.id,
      config: {},
      status: 'active',
    }
  })

  const emailChannel = await prisma.channel.create({
    data: {
      name: 'Email Suporte',
      type: 'email',
      userId: adminUser.id,
      config: {},
      status: 'active',
    }
  })

  // Criar conversas
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        contactId: contacts[0].id,
        userId: adminUser.id,
        status: 'open',
        priority: 'high',
        channelId: whatsappChannel.id,
        assignedAgentId: adminUser.id,
        assignedTeamId: team.id,
        tags: ['urgente', 'novo-cliente'],
        lastMessage: 'Olá, preciso de ajuda com meu pedido',
        lastActivity: new Date(),
        unreadCount: 2,
      }
    }),
    prisma.conversation.create({
      data: {
        contactId: contacts[1].id,
        userId: adminUser.id,
        status: 'pending',
        priority: 'normal',
        channelId: emailChannel.id,
        assignedTeamId: team.id,
        tags: ['suporte'],
        lastMessage: 'Quando vou receber minha fatura?',
        lastActivity: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
        unreadCount: 1,
      }
    }),
    prisma.conversation.create({
      data: {
        contactId: contacts[2].id,
        userId: adminUser.id,
        status: 'closed',
        priority: 'low',
        channelId: whatsappChannel.id,
        assignedAgentId: adminUser.id,
        assignedTeamId: team.id,
        tags: ['resolvido'],
        lastMessage: 'Muito obrigado pela ajuda!',
        lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h atrás
        unreadCount: 0,
      }
    })
  ])

  // Criar mensagens
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        content: 'Olá! Como posso ajudá-lo hoje?',
        fromMe: true,
        type: 'text',
        userId: adminUser.id,
        status: 'sent',
      }
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        content: 'Preciso de ajuda com meu pedido #12345',
        fromMe: false,
        type: 'text',
        userId: adminUser.id,
        status: 'received',
      }
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[1].id,
        content: 'Quando vou receber minha fatura?',
        fromMe: false,
        type: 'text',
        userId: adminUser.id,
        status: 'received',
      }
    })
  ])

  // Criar macros
  await Promise.all([
    prisma.macro.create({
      data: {
        name: 'Saudação Inicial',
        content: 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?',
        shortcut: '/ola',
        userId: adminUser.id,
      }
    }),
    prisma.macro.create({
      data: {
        name: 'Informar Horário',
        content: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
        shortcut: '/horario',
        userId: adminUser.id,
      }
    }),
    prisma.macro.create({
      data: {
        name: 'Finalizar Atendimento',
        content: 'Foi um prazer ajudá-lo! Se precisar de mais alguma coisa, estaremos aqui.',
        shortcut: '/tchau',
        userId: adminUser.id,
      }
    })
  ])

  console.log('✅ Seed completo finalizado!')
  console.log(`👤 Usuário criado: ${adminUser.email} (senha: 123456)`)
  console.log(`👥 Equipe criada: ${team.name}`)
  console.log(`📞 ${contacts.length} contatos criados`)
  console.log(`💬 ${conversations.length} conversas criadas`)
  console.log(`📝 3 macros criadas`)
  console.log(`📱 2 canais criados`)
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
