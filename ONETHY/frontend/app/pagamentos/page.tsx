'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Badge, StatCard, ProgressBar } from '@/components/UI'
import { CampaignsIcon, InboxIcon, ContactsIcon, WhatsappIcon, LoadingIcon } from '@/components/Icons'
import { useToast } from '@/components/Toast'

type Plan = { 
  id: number
  name: string
  priceCents: number
  interval: string
  features?: any
  active?: boolean
}

type Subscription = {
  id: string
  planId: number
  plan: Plan
  status: string
  expiresAt: string
}

export default function PagamentosPage() {
  const { token } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState({ sent: 0, limit: 1000 })
  const [history, setHistory] = useState<any[]>([])
  const [payLoading, setPayLoading] = useState(false)
  const [statusPolling, setStatusPolling] = useState(false)
  const toast = useToast()

  const API_BASE = '/api'

  useEffect(() => {
    if (!token) return
    loadData()
    const interval = setInterval(loadData, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [token])

  async function loadData() {
    if (!token) return
    try {
      // Load plans
      const plansRes = await fetch(`${API_BASE}/plans`)
      const plansData = await plansRes.json()
      if (plansData.success) {
        setPlans(plansData.plans || [])
      }

      // Load current subscription
      const subRes = await fetch(`${API_BASE}/subscriptions/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const subData = await subRes.json()
      if (subData.success) {
        setCurrent(subData.subscription)
        
        // If status changed, show toast
        if (current && subData.subscription?.status !== current.status) {
          const newStatus = subData.subscription?.status
          if (newStatus === 'active') {
            toast && toast('Pagamento aprovado! Sua assinatura está ativa.', 'success')
          } else if (newStatus === 'cancelled') {
            toast && toast('Assinatura cancelada com sucesso.', 'success')
          }
        }
      }

      // Load usage stats
      const usageRes = await fetch(`${API_BASE}/messages/count`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const usageData = await usageRes.json()
      if (usageData.success) {
        setUsage({
          sent: usageData.count || 0,
          limit: current?.plan?.features?.messagesPerMonth || 1000
        })
      }

      // Load history
      const historyRes = await fetch(`${API_BASE}/subscriptions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const historyData = await historyRes.json()
      if (historyData.success) {
        setHistory(historyData.subscriptions || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleSubscribe = async (planId: number) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId })
      })
      const data = await res.json()
      if (data.success) {
        setCurrent(data.subscription)
        toast && toast('Assinatura criada com sucesso!', 'success')
      } else {
        toast && toast(data.message || 'Erro ao criar assinatura', 'error')
      }
    } catch (error) {
      toast && toast('Erro ao criar assinatura', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setCurrent(data.subscription)
        toast && toast('Assinatura cancelada!', 'success')
      } else {
        toast && toast(data.message || 'Erro ao cancelar assinatura', 'error')
      }
    } catch (error) {
      toast && toast('Erro ao cancelar assinatura', 'error')
    } finally {
      setLoading(false)
    }
  }

  const payWithMercadoPago = async (planId: number) => {
    if (!token) return
    setPayLoading(true)
    try {
      const res = await fetch(`${API_BASE}/billing/checkout-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId })
      })
      const data = await res.json()
      if (data.init_point) {
        window.open(data.init_point, '_blank')
        setStatusPolling(true)
        toast && toast('Redirecionando para pagamento...', 'success')
      } else {
        toast && toast(data.message || 'Erro ao gerar pagamento', 'error')
      }
    } catch (error) {
      toast && toast('Erro ao processar pagamento', 'error')
    } finally {
      setPayLoading(false)
    }
  }

  const downloadReceipt = async (paymentId: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/subscriptions/receipt/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-${paymentId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast && toast('Erro ao baixar recibo', 'error')
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Ativo</Badge>
      case 'cancelled': return <Badge variant="error">Cancelado</Badge>
      case 'pending': return <Badge variant="default">Pendente</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  const usagePercentage = usage.limit > 0 ? Math.min((usage.sent / usage.limit) * 100, 100) : 0

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                Planos e Pagamentos
              </h1>
              <p className="text-text-muted mt-1">
                Gerencie sua assinatura e método de pagamento
              </p>
            </div>
            {statusPolling && (
              <div className="flex items-center gap-2 text-emerald-400">
                <LoadingIcon className="w-4 h-4 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            )}
          </div>

          {/* Current Plan Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Plano Atual"
              value={current?.plan?.name || 'Nenhum'}
              icon={<CampaignsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Status"
              value={current?.status ? (current.status === 'active' ? 'Ativo' : 'Inativo') : 'N/A'}
              icon={<WhatsappIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Mensagens Usadas"
              value={`${usage.sent}/${usage.limit}`}
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Expira em"
              value={current?.expiresAt ? formatDate(current.expiresAt) : 'N/A'}
              icon={<ContactsIcon className="w-6 h-6" />}
            />
          </div>

          {/* Usage Progress */}
          {current && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Uso de Mensagens</h3>
                <span className="text-sm text-slate-400">
                  {usage.sent} de {usage.limit} mensagens
                </span>
              </div>
              <ProgressBar
                value={usage.sent}
                max={usage.limit}
                className={usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}
              />
              <p className="text-sm text-slate-400 mt-2">
                {usagePercentage.toFixed(1)}% do limite mensal utilizado
              </p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Planos Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} className={`card p-6 relative ${
                  current?.planId === plan.id ? 'ring-2 ring-emerald-400' : ''
                }`}>
                  {current?.planId === plan.id && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="success">Plano Atual</Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-white">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-emerald-400">
                        {formatPrice(plan.priceCents)}
                      </span>
                      <span className="text-slate-400">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features && Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-slate-300">
                          {key === 'messagesPerMonth' ? `${value} mensagens/mês` :
                           key === 'contacts' ? `${value} contatos` :
                           key === 'support' ? `Suporte ${value}` :
                           `${key}: ${value}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {current?.planId === plan.id ? (
                      <>
                        <div className="text-center mb-4">
                          {getStatusBadge(current.status)}
                        </div>
                        {current.status === 'active' && (
                          <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="btn btn-outline w-full"
                          >
                            {loading ? 'Cancelando...' : 'Cancelar Plano'}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={loading || payLoading}
                          className="btn btn-secondary w-full"
                        >
                          {loading ? 'Ativando...' : 'Ativar Plano'}
                        </button>
                        <button
                          onClick={() => payWithMercadoPago(plan.id)}
                          disabled={loading || payLoading}
                          className="btn btn-primary w-full"
                        >
                          {payLoading ? 'Processando...' : 'Pagar com Mercado Pago'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History */}
          {history.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-300">Data</th>
                      <th className="text-left p-3 font-medium text-slate-300">Plano</th>
                      <th className="text-left p-3 font-medium text-slate-300">Valor</th>
                      <th className="text-left p-3 font-medium text-slate-300">Status</th>
                      <th className="text-left p-3 font-medium text-slate-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 text-slate-300">{formatDate(item.createdAt)}</td>
                        <td className="p-3 text-white font-medium">{item.plan?.name}</td>
                        <td className="p-3 text-slate-300">{formatPrice(item.plan?.priceCents || 0)}</td>
                        <td className="p-3">{getStatusBadge(item.status)}</td>
                        <td className="p-3">
                          {item.paymentId && (
                            <button
                              onClick={() => downloadReceipt(item.paymentId)}
                              className="text-emerald-400 hover:text-emerald-300 text-sm"
                            >
                              Baixar Recibo
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Shell>
    </ProtectedRoute>
  )
}

