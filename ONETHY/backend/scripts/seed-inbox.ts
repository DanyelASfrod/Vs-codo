import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedInboxData() {
  console.log('🌱 Populando banco com dados da inbox...')

  try {
    // 1. Criar usuário de teste se não existir
    let testUser = await prisma.user.findUnique({
      where: { email: 'inbox@test.com' }
    })

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('123456', 10)
      testUser = await prisma.user.create({
        data: {
          name: 'Usuário Inbox',
          email: 'inbox@test.com',
          password: hashedPassword,
          role: 'admin'
        }
      })
    }

    console.log(`✅ Usuário: ${testUser.email}`)

    // 2. Criar canal WhatsApp se não existir
    let whatsappChannel = await prisma.channel.findFirst({
      where: { 
        userId: testUser.id,
        type: 'whatsapp'
      }
    })

    if (!whatsappChannel) {
      whatsappChannel = await prisma.channel.create({
        data: {
          userId: testUser.id,
          name: 'WhatsApp Business',
          type: 'whatsapp',
          phone: '5511999999999',
          status: 'active'
        }
      })
    }

    console.log(`✅ Canal: ${whatsappChannel.name}`)

    // 3. Criar equipe de vendas
    let salesTeam = await prisma.team.findFirst({
      where: { 
        name: 'Equipe de Vendas'
      }
    })

    if (!salesTeam) {
      salesTeam = await prisma.team.create({
        data: {
          name: 'Equipe de Vendas',
          description: 'Equipe responsável por vendas e prospecção',
          color: '#10B981'
        }
      })
    }

    console.log(`✅ Equipe: ${salesTeam.name}`)

    // 4. Criar contatos de exemplo
    const contactsData = [
      {
        name: 'João Silva',
        phone: '5511987654321',
        email: 'joao.silva@email.com'
      },
      {
        name: 'Maria Santos',
        phone: '5511876543210',
        email: 'maria.santos@email.com'
      },
      {
        name: 'Pedro Oliveira',
        phone: '5511765432109',
        email: 'pedro.oliveira@email.com'
      },
      {
        name: 'Ana Costa',
        phone: '5511654321098',
        email: 'ana.costa@email.com'
      },
      {
        name: 'Carlos Lima',
        phone: '5511543210987',
        email: 'carlos.lima@email.com'
      }
    ]

    const contacts = []
    for (const contactData of contactsData) {
      let contact = await prisma.contact.findFirst({
        where: {
          userId: testUser.id,
          phone: contactData.phone
        }
      })

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            ...contactData,
            userId: testUser.id
          }
        })
      }
      contacts.push(contact)
    }

    console.log(`✅ Contatos: ${contacts.length} criados`)

    // 5. Criar atributos para alguns contatos
    const attributes = [
      { contactId: contacts[0].id, name: 'Empresa', value: 'Tech Corp', type: 'text' },
      { contactId: contacts[0].id, name: 'Cargo', value: 'CEO', type: 'text' },
      { contactId: contacts[1].id, name: 'Idade', value: '28', type: 'number' },
      { contactId: contacts[1].id, name: 'Interesse', value: 'Premium', type: 'text' },
      { contactId: contacts[2].id, name: 'Localização', value: 'São Paulo', type: 'text' }
    ]

    for (const attr of attributes) {
      const existing = await prisma.contactAttribute.findFirst({
        where: {
          contactId: attr.contactId,
          name: attr.name
        }
      })

      if (!existing) {
        await prisma.contactAttribute.create({ data: attr })
      }
    }

    console.log(`✅ Atributos: ${attributes.length} criados`)

    // 6. Criar conversas
    const conversationsData = [
      {
        contactId: contacts[0].id,
        status: 'open',
        priority: 'high',
        lastMessage: 'Gostaria de saber mais sobre os planos premium'
      },
      {
        contactId: contacts[1].id,
        status: 'pending',
        priority: 'medium',
        lastMessage: 'Olá! Preciso de ajuda com minha conta'
      },
      {
        contactId: contacts[2].id,
        status: 'closed',
        priority: 'low',
        lastMessage: 'Obrigado pelo atendimento!'
      },
      {
        contactId: contacts[3].id,
        status: 'open',
        priority: 'high',
        lastMessage: 'Quando posso agendar uma demonstração?',
        assignedAgentId: testUser.id,
        assignedTeamId: salesTeam.id
      },
      {
        contactId: contacts[4].id,
        status: 'pending',
        priority: 'medium',
        lastMessage: 'Tive um problema com o pagamento',
        tags: ['pagamento', 'problema']
      }
    ]

    const conversations = []
    for (const convData of conversationsData) {
      let conversation = await prisma.conversation.findFirst({
        where: {
          userId: testUser.id,
          contactId: convData.contactId
        }
      })

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            ...convData,
            userId: testUser.id,
            channelId: whatsappChannel.id,
            unreadCount: convData.status === 'open' ? Math.floor(Math.random() * 5) + 1 : 0
          }
        })
      }
      conversations.push(conversation)
    }

    console.log(`✅ Conversas: ${conversations.length} criadas`)

    // 7. Criar mensagens de exemplo
    const messagesData = [
      // Conversa 1 (João Silva)
      {
        conversationId: conversations[0].id,
        content: 'Oi! Vi vocês no Instagram e fiquei interessado',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 3600000) // 1 hora atrás
      },
      {
        conversationId: conversations[0].id,
        content: 'Olá João! Que bom te conhecer. Como posso ajudá-lo?',
        type: 'text',
        fromMe: true,
        timestamp: new Date(Date.now() - 3500000)
      },
      {
        conversationId: conversations[0].id,
        content: 'Gostaria de saber mais sobre os planos premium',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 1800000) // 30 min atrás
      },

      // Conversa 2 (Maria Santos)
      {
        conversationId: conversations[1].id,
        content: 'Olá! Preciso de ajuda com minha conta',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 7200000) // 2 horas atrás
      },
      {
        conversationId: conversations[1].id,
        content: 'Claro! Posso ajudá-la. Qual é o problema?',
        type: 'text',
        fromMe: true,
        timestamp: new Date(Date.now() - 7000000)
      },

      // Conversa 3 (Pedro Oliveira)
      {
        conversationId: conversations[2].id,
        content: 'Muito obrigado pelo excelente atendimento!',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 86400000) // 1 dia atrás
      },
      {
        conversationId: conversations[2].id,
        content: 'Obrigado pelo atendimento!',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 86300000)
      },

      // Conversa 4 (Ana Costa)
      {
        conversationId: conversations[3].id,
        content: 'Quando posso agendar uma demonstração?',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 600000) // 10 min atrás
      },

      // Conversa 5 (Carlos Lima)
      {
        conversationId: conversations[4].id,
        content: 'Tive um problema com o pagamento',
        type: 'text',
        fromMe: false,
        timestamp: new Date(Date.now() - 1200000) // 20 min atrás
      }
    ]

    for (const msgData of messagesData) {
      const existing = await prisma.message.findFirst({
        where: {
          conversationId: msgData.conversationId,
          content: msgData.content,
          timestamp: msgData.timestamp
        }
      })

      if (!existing) {
        await prisma.message.create({
          data: {
            ...msgData,
            userId: testUser.id,
            status: 'delivered'
          }
        })
      }
    }

    console.log(`✅ Mensagens: ${messagesData.length} criadas`)

    // 8. Criar notas para algumas conversas
    const notesData = [
      {
        conversationId: conversations[0].id,
        content: 'Cliente interessado em plano premium. Empresa de médio porte.',
        isPrivate: false
      },
      {
        conversationId: conversations[0].id,
        content: 'Verificar histórico de compras para desconto.',
        isPrivate: true
      },
      {
        conversationId: conversations[3].id,
        content: 'Demonstração agendada para próxima semana.',
        isPrivate: false
      }
    ]

    for (const noteData of notesData) {
      const existing = await prisma.conversationNote.findFirst({
        where: {
          conversationId: noteData.conversationId,
          content: noteData.content
        }
      })

      if (!existing) {
        await prisma.conversationNote.create({
          data: {
            ...noteData,
            userId: testUser.id
          }
        })
      }
    }

    console.log(`✅ Notas: ${notesData.length} criadas`)

    // 9. Criar macros padrão
    const macrosData = [
      {
        name: 'Saudação Inicial',
        content: 'Olá! Seja bem-vindo(a) à nossa empresa. Como posso ajudá-lo(a) hoje?',
        shortcut: '/ola'
      },
      {
        name: 'Horário de Atendimento',
        content: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Em breve retornaremos seu contato!',
        shortcut: '/horario'
      },
      {
        name: 'Solicitar Dados',
        content: 'Para prosseguir com o atendimento, preciso de algumas informações. Pode me fornecer seu nome completo e e-mail?',
        shortcut: '/dados'
      },
      {
        name: 'Encerramento',
        content: 'Foi um prazer atendê-lo(a)! Se precisar de mais alguma coisa, não hesite em nos contactar. Tenha um ótimo dia!',
        shortcut: '/tchau'
      },
      {
        name: 'Transferir para Vendas',
        content: 'Vou transferir você para nossa equipe de vendas, que poderá ajudá-lo(a) melhor com sua solicitação.',
        shortcut: '/vendas'
      }
    ]

    for (const macroData of macrosData) {
      const existing = await prisma.macro.findFirst({
        where: {
          userId: testUser.id,
          name: macroData.name
        }
      })

      if (!existing) {
        await prisma.macro.create({
          data: {
            ...macroData,
            userId: testUser.id
          }
        })
      }
    }

    console.log(`✅ Macros: ${macrosData.length} criadas`)

    // 10. Adicionar participantes nas conversas
    for (const conv of conversations) {
      const existing = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: conv.id,
          userId: testUser.id
        }
      })

      if (!existing) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: conv.id,
            userId: testUser.id,
            role: 'agent'
          }
        })
      }
    }

    console.log(`✅ Participantes adicionados`)

    console.log('\n🎉 Dados da inbox criados com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`- Usuário: inbox@test.com (senha: 123456)`)
    console.log(`- ${contacts.length} contatos`)
    console.log(`- ${conversations.length} conversas`)
    console.log(`- ${messagesData.length} mensagens`)
    console.log(`- ${notesData.length} notas`)
    console.log(`- ${macrosData.length} macros`)
    console.log(`- 1 equipe de vendas`)
    console.log(`- 1 canal WhatsApp`)

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedInboxData()
}

export default seedInboxData
