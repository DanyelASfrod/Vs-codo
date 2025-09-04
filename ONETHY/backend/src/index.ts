import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config, showConfigSummary } from './config/env'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma, healthCheck } from './lib/db'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import PDFDocument from 'pdfkit'

// Import routes
import inboxRoutes from './routes/inbox'
import conversationsRoutes from './routes/conversations'
import messagesRoutes from './routes/messages'
import teamsRoutes from './routes/teams'
import macrosRoutes from './routes/macros'
import channelsRoutes from './routes/channels'
import webhookRoutes from './routes/webhook'

const app = express()

// Exibir resumo da configuração na inicialização

app.use(helmet())
app.use(cors({ 
  origin: config.server.corsOrigins,
  credentials: true 
}))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ 
  ok: true, 
  environment: config.server.nodeEnv,
  database: config.database.name,
  version: '1.0.0'
}))

app.get('/db/health', async (_req, res) => {
  const status = await healthCheck()
  res.json(status)
})

// Stats do dashboard (dados do DB)
app.get('/stats', authMiddleware, async (req: any, res) => {
  const startOfDay = new Date()
  startOfDay.setHours(0,0,0,0)
  const messagesToday = await prisma.message.count({ where: { userId: req.user.id, createdAt: { gte: startOfDay } } })
  // Campos não modelados ainda retornam 0/placeholder
  const conversations = 0
  const responseTime = null
  const whatsappStatus = 'online'
  res.json({ success: true, data: { messagesToday, conversations, responseTime, whatsappStatus } })
})

// Auth (JWT) com configuração tipada
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Dados inválidos' })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ success: false, message: 'E-mail já cadastrado' })
    const hash = await bcrypt.hash(password, config.auth.bcryptRounds)
    const user = await prisma.user.create({ data: { name, email, password: hash, company } })

    // Cria assinatura trial de 14 dias no plano Business
    try {
  const business = await (prisma as any).plan.findUnique({ where: { name: 'Business' } })
      if (business && business.active) {
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 14)
  await (prisma as any).subscription.create({
          data: {
            userId: user.id,
            planId: business.id,
            status: 'active',
            provider: 'trial',
            providerRef: `trial_${user.id}_${Date.now()}`,
            currentPeriodEnd
          }
        })
      }
    } catch {}

    const token = jwt.sign({ id: user.id, email: user.email }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao registrar' })
  }
})

// Duplicar para acessibilidade em /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Dados inválidos' })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ success: false, message: 'E-mail já cadastrado' })
    const hash = await bcrypt.hash(password, config.auth.bcryptRounds)
    const user = await prisma.user.create({ data: { name, email, password: hash, company } })

    // Cria assinatura trial de 14 dias no plano Business
    try {
  const business = await (prisma as any).plan.findUnique({ where: { name: 'Business' } })
      if (business && business.active) {
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 14)
  await (prisma as any).subscription.create({
          data: {
            userId: user.id,
            planId: business.id,
            status: 'active',
            provider: 'trial',
            providerRef: `trial_${user.id}_${Date.now()}`,
            currentPeriodEnd
          }
        })
      }
    } catch {}

    const token = jwt.sign({ id: user.id, email: user.email }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao registrar' })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, message: 'Dados inválidos' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ success: false, message: 'Credenciais inválidas' })
  const token = jwt.sign({ id: user.id, email: user.email }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { userId: user.id, token: refreshToken, expiresAt } })
  res.json({ success: true, token, refreshToken, user: { id: user.id, name: user.name, email: user.email } })
})

// Duplicar para acessibilidade em /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, message: 'Dados inválidos' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ success: false, message: 'Credenciais inválidas' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ success: false, message: 'Credenciais inválidas' })
  const token = jwt.sign({ id: user.id, email: user.email }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { userId: user.id, token: refreshToken, expiresAt } })
  res.json({ success: true, token, refreshToken, user: { id: user.id, name: user.name, email: user.email } })
})

// Refresh token
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string }
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token ausente' })
  const session = await prisma.session.findUnique({ where: { token: refreshToken } })
  if (!session) return res.status(401).json({ success: false, message: 'Refresh token inválido' })
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token: refreshToken } })
    return res.status(401).json({ success: false, message: 'Refresh token expirado' })
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return res.status(401).json({ success: false, message: 'Usuário não encontrado' })
  const token = jwt.sign({ id: user.id, email: user.email }, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
  res.json({ success: true, token })
})

// Logout
app.post('/auth/logout', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string }
  if (refreshToken) {
    try { await prisma.session.delete({ where: { token: refreshToken } }) } catch {}
  }
  res.json({ success: true })
})

// Auth middleware
function authMiddleware(req: express.Request & { user?: { id: number; email: string; role?: string } }, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Sem token' })
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { id: number; email: string; role?: string }
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido' })
  }
}

// Me
app.get('/me', authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, company: true } })
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' })
  res.json({ success: true, user })
})

// Histórico de assinaturas do usuário
app.get('/subscriptions/history', authMiddleware, async (req: any, res) => {
  const subs = await (prisma as any).subscription.findMany({
    where: { userId: req.user.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json({ success: true, subscriptions: subs })
})

// Recibo/fatura simples em PDF para assinatura
app.get('/subscriptions/receipt/:id', authMiddleware, async (req: any, res) => {
  const sub = await (prisma as any).subscription.findUnique({
    where: { id: Number(req.params.id) },
    include: { plan: true, user: true }
  })
  if (!sub || sub.userId !== req.user.id) return res.status(404).json({ success: false, message: 'Recibo não encontrado' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=recibo_${sub.id}.pdf`)
  const doc = new PDFDocument()
  doc.pipe(res)
  doc.fontSize(18).text('Recibo de Assinatura ONETHY', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Usuário: ${sub.user.name} (${sub.user.email})`)
  doc.text(`Plano: ${sub.plan.name}`)
  doc.text(`Valor: R$ ${(sub.plan.priceCents/100).toFixed(2)}`)
  doc.text(`Status: ${sub.status}`)
  doc.text(`Início: ${sub.createdAt.toLocaleDateString()}`)
  doc.text(`Fim: ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '-'}`)
  doc.text(`Provedor: ${sub.provider}`)
  doc.text(`ID da Assinatura: ${sub.id}`)
  doc.end()
})

// Contar mensagens enviadas no período
app.get('/messages/count', authMiddleware, async (req: any, res) => {
  const userId = req.user.id
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ success: false, message: 'Parâmetros start e end obrigatórios' })
  const count = await prisma.message.count({
    where: {
      userId,
      createdAt: { gte: new Date(start as string), lte: new Date(end as string) }
    }
  })
  res.json({ success: true, count })
})

// ===== API namespace para compatibilidade com o frontend =====
// Proxy/alias para contagem de mensagens (mesma lógica acima)
app.get('/api/messages/count', authMiddleware, async (req: any, res) => {
  const userId = req.user.id
  const { start, end } = req.query
  if (!start || !end) return res.status(400).json({ success: false, message: 'Parâmetros start e end obrigatórios' })
  const count = await prisma.message.count({
    where: {
      userId,
      createdAt: { gte: new Date(start as string), lte: new Date(end as string) }
    }
  })
  res.json({ success: true, count })
})

// Relatórios agregados
app.get('/api/reports', authMiddleware, async (req: any, res) => {
  const userId = req.user.id
  // Sent messages total (últimos 30 dias)
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  const sentMessages = await prisma.message.count({ where: { userId, createdAt: { gte: start, lte: end } } })

  // Mensagens por dia (últimos 7 dias)
  const messagesByDay: { label: string; value: number; max?: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const dStart = new Date()
    dStart.setHours(0, 0, 0, 0)
    dStart.setDate(dStart.getDate() - i)
    const dEnd = new Date(dStart)
    dEnd.setHours(23, 59, 59, 999)
    const dayCount = await prisma.message.count({ where: { userId, createdAt: { gte: dStart, lte: dEnd } } })
    const label = i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : `${i} dias`
    messagesByDay.push({ label, value: dayCount, max: 1000 })
  }

  // Campanhas simples (lista últimas campanhas do usuário, se existirem)
  let campaigns: any[] = []
  try {
    campaigns = await (prisma as any).campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    campaigns = campaigns.map((c: any) => ({
      name: c.name,
      active: c.status === 'active',
      sent: c.totalMessages ?? 0,
      delivered: c.sentMessages ?? 0
    }))
  } catch {}

  // Métricas detalhadas básicas
  const metrics = [
    { label: 'Mensagens Enviadas', today: messagesByDay[6]?.value ?? 0, yesterday: messagesByDay[5]?.value ?? 0, sevenDays: messagesByDay.reduce((s, r) => s + r.value, 0), thirtyDays: sentMessages },
  ]

  // Taxas (placeholders até haver tracking)
  const deliveryRate = `${Math.min(100, Math.max(0, Math.round((metrics[0].today / (metrics[0].today || 1)) * 95)))}%`
  const openRate = '0%'
  const conversionRate = '0%'

  res.json({
    sentMessages,
    sentChange: '+0%',
    deliveryRate,
    deliveryChange: '+0%',
    openRate,
    openChange: '+0%',
    conversionRate,
    conversionChange: '+0%',
    messagesByDay,
    campaigns,
    metrics
  })
})

// FAQs (sem modelo ainda)
app.get('/api/faqs', authMiddleware, async (_req, res) => {
  res.json({ faqs: [] })
})
// ---------- Planos e Assinaturas ----------
// Listar planos ativos
app.get('/plans', async (_req, res) => {
  const plans = await (prisma as any).plan.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } })
  res.json({ success: true, plans })
})

// Criar/atualizar plano (simples - sem auth de admin neste MVP)
app.post('/plans', authMiddleware, async (req: any, res) => {
  // Só admin pode criar/editar planos
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user || (user as any).role !== 'admin') return res.status(403).json({ success: false, message: 'Acesso negado' })
  const { name, priceCents, interval, features, active } = req.body
  if (!name || !priceCents || !interval) return res.status(400).json({ success: false, message: 'Dados inválidos' })
  const plan = await (prisma as any).plan.upsert({
    where: { name },
    update: { priceCents, interval, features, active: active ?? true },
    create: { name, priceCents, interval, features, active: active ?? true }
  })
  res.json({ success: true, plan })
})

// Assinar um plano
app.post('/subscriptions', authMiddleware, async (req: any, res) => {
  const { planId } = req.body as { planId?: number }
  if (!planId) return res.status(400).json({ success: false, message: 'planId obrigatório' })
  const plan = await (prisma as any).plan.findUnique({ where: { id: planId, active: true } })
  if (!plan) return res.status(404).json({ success: false, message: 'Plano não encontrado' })

  // Cancela assinaturas ativas anteriores (simples)
  await (prisma as any).subscription.updateMany({
    where: { userId: req.user.id, status: 'active' },
    data: { status: 'canceled' }
  })

  const currentPeriodEnd = new Date()
  if (plan.interval === 'month') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
  else if (plan.interval === 'year') currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)

  const sub = await (prisma as any).subscription.create({
    data: {
      userId: req.user.id,
      planId: plan.id,
      status: 'active',
      provider: 'mock',
      providerRef: `sub_${Date.now()}`,
      currentPeriodEnd
    },
    include: { plan: true }
  })
  res.json({ success: true, subscription: sub })
})

// Ver assinatura atual
app.get('/subscriptions/me', authMiddleware, async (req: any, res) => {
  const sub = await (prisma as any).subscription.findFirst({
    where: { userId: req.user.id, status: 'active' },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json({ success: true, subscription: sub })
})

// Cancelar assinatura
app.post('/subscriptions/cancel', authMiddleware, async (req: any, res) => {
  await (prisma as any).subscription.updateMany({ where: { userId: req.user.id, status: 'active' }, data: { status: 'canceled' } })
  res.json({ success: true })
})

// Example: create a user (dev only)
app.post('/dev/users', async (req, res) => {
  try {
    const { name, email, password, company } = req.body
    const user = await prisma.user.create({
      data: { name, email, password, company }
    })
    res.json({ ok: true, user })
  } catch (err) {
    res.status(400).json({ ok: false, error: (err as Error).message })
  }
})

import mercadopago from 'mercadopago'

const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' })

// Mercado Pago checkout para assinatura
app.post('/billing/checkout-subscription', authMiddleware, async (req: any, res) => {
  const { planId } = req.body
  const userId = req.user.id
  const plan = await (prisma as any).plan.findUnique({ where: { id: planId } })
  if (!plan || !plan.active) return res.status(404).json({ success: false, message: 'Plano não encontrado' })

  // Cria preferência Mercado Pago
  try {
    const preferenceClient = new Preference(mp)
    const preference = await preferenceClient.create({
      body: {
        items: [{
          id: String(plan.id),
          title: `Assinatura ONETHY - ${plan.name}`,
          quantity: 1,
          unit_price: plan.priceCents / 100
        }],
        back_urls: {
          success: 'http://localhost:3000/pagamentos?status=success',
          failure: 'http://localhost:3000/pagamentos?status=failure',
          pending: 'http://localhost:3000/pagamentos?status=pending'
        },
        auto_return: 'approved',
        external_reference: `sub_${userId}_${planId}_${Date.now()}`
      }
    })

    // Cria Subscription pendente
    const currentPeriodEnd = new Date()
    if (plan.interval === 'month') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    else if (plan.interval === 'year') currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)

  const sub = await (prisma as any).subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'pending',
        provider: 'mercado_pago',
  providerRef: preference.id as any,
        currentPeriodEnd
      },
      include: { plan: true }
    })

  res.json({ success: true, init_point: (preference.init_point || preference.sandbox_init_point), subscription: sub })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro Mercado Pago', error: String(err) })
  }
})

// Mercado Pago webhook para atualizar status da assinatura
app.post('/billing/webhook', async (req, res) => {
  // Exemplo: Mercado Pago envia notificação de pagamento
  const { data, type } = req.body
  if (type === 'payment' && data?.id) {
    // Buscar pagamento
    try {
  const paymentClient = new Payment(mp)
  const payment = await paymentClient.get({ id: String(data.id) })
  const extRef = (payment as any).external_reference as string | undefined
  const status = (payment as any).status as string | undefined
      // Atualiza assinatura
      if (extRef) {
        let newStatus = 'pending'
        if (status === 'approved') newStatus = 'active'
        if (status === 'rejected' || status === 'cancelled') newStatus = 'canceled'
  await (prisma as any).subscription.updateMany({ where: { providerRef: extRef }, data: { status: newStatus } })
      }
    } catch {}
  }
  res.status(200).end()
})

// Evolution API mocks
app.get('/evolution/qr', (_req, res) => {
  res.json({ qr: 'data:image/png;base64,mockqr' })
})
app.get('/evolution/status', (_req, res) => {
  res.json({ status: 'online', lastCheck: new Date().toISOString() })
})
app.post('/evolution/send', authMiddleware, async (req: any, res) => {
  // Enforcement de limite de mensagens do plano
  const userId = req.user.id
  // Busca assinatura ativa
  const sub = await (prisma as any).subscription.findFirst({
    where: { userId, status: 'active' },
    include: { plan: true }
  })
  if (!sub || !sub.plan) return res.status(403).json({ success: false, message: 'Assinatura ativa obrigatória' })
  const limit = sub.plan.features?.messages ?? 0
  // Conta mensagens enviadas no período
  const start = new Date(sub.createdAt)
  const end = sub.currentPeriodEnd ?? new Date()
  const count = await prisma.message.count({
    where: {
      userId,
      createdAt: { gte: start, lte: end }
    }
  })
  if (count >= limit) return res.status(403).json({ success: false, message: 'Limite de mensagens do plano atingido' })
  // Envia mensagem (mock)
  const msg = await prisma.message.create({
    data: {
      userId,
      to: req.body.to,
      content: req.body.message,
      status: 'sent'
    }
  })
  res.json({ sent: true, to: msg.to, message: msg.content })
})

// Evolution webhook
app.post('/webhooks/evolution', (req, res) => {
  console.log('Evolution webhook:', req.body)
  res.status(200).end()
})

// Import controllers
import { getContacts, createContact, updateContact, deleteContact } from './controllers/contactsController'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from './controllers/campaignsController'
import { getConversations, getConversation, updateConversationStatus } from './controllers/conversationsController'
import { getTickets, createTicket, updateTicket } from './controllers/ticketsController'
import { getChatbotFlows, createChatbotFlow, updateChatbotFlow, deleteChatbotFlow, getChatbotFlow, duplicateChatbotFlow, simulateFlow } from './controllers/chatbotController'
import { getChannels, createChannel, updateChannel, deleteChannel } from './controllers/channelsController'

// Chatbot flows routes (com prefixo /api explícito para compatibilidade com rewrite)
app.get('/api/chatbot/flows', authMiddleware, getChatbotFlows)
app.post('/api/chatbot/flows', authMiddleware, createChatbotFlow)
app.get('/api/chatbot/flows/:id', authMiddleware, getChatbotFlow)
app.put('/api/chatbot/flows/:id', authMiddleware, updateChatbotFlow)
app.delete('/api/chatbot/flows/:id', authMiddleware, deleteChatbotFlow)
app.post('/api/chatbot/flows/:id/duplicate', authMiddleware, duplicateChatbotFlow)
app.post('/api/chatbot/flows/:id/simulate', authMiddleware, simulateFlow)

// Contacts routes
app.get('/contacts', authMiddleware, getContacts)
app.post('/contacts', authMiddleware, createContact)
app.put('/contacts/:id', authMiddleware, updateContact)
app.delete('/contacts/:id', authMiddleware, deleteContact)

// Campaigns routes
app.get('/campaigns', authMiddleware, getCampaigns)
app.post('/campaigns', authMiddleware, createCampaign)
app.put('/campaigns/:id', authMiddleware, updateCampaign)
app.delete('/campaigns/:id', authMiddleware, deleteCampaign)

// Conversations routes
app.get('/conversations', authMiddleware, getConversations)
app.get('/conversations/:id', authMiddleware, getConversation)
app.put('/conversations/:id/status', authMiddleware, updateConversationStatus)

// Support tickets routes
app.get('/tickets', authMiddleware, getTickets)
app.post('/tickets', authMiddleware, createTicket)
app.put('/tickets/:id', authMiddleware, updateTicket)

// Channels routes
app.use('/api/channels', authMiddleware, channelsRoutes)

// Webhook routes (sem autenticação para receber webhooks externos)
app.use('/', webhookRoutes)

// ====== ROTAS DA INBOX ======
app.use('/api/inbox', authMiddleware, inboxRoutes)
app.use('/api/conversations', authMiddleware, conversationsRoutes)
app.use('/api/messages', authMiddleware, messagesRoutes)
app.use('/api/teams', authMiddleware, teamsRoutes)
app.use('/api/macros', authMiddleware, macrosRoutes)

const port = config.server.port
app.listen(port, () => {
  console.log(`🌟 API listening on http://${config.server.host}:${port}`)
  console.log(`📝 Environment: ${config.server.nodeEnv}`)
  console.log(`📧 Inbox API ready at /api/inbox`)
  console.log(`🗄️  Database: ${config.database.name}`)
})
