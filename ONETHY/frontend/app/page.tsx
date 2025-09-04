'use client'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { health, getStats, getCampaigns } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { StatCard, EmptyState, AnimatedCounter, ProgressBar, Badge } from '@/components/UI'
import { 
  InboxIcon, ContactsIcon, WhatsappIcon, ReportsIcon, 
  CampaignsIcon, LoadingIcon 
} from '@/components/Icons'

export default function Page() {
  const { token } = useAuth()
  const [status, setStatus] = useState<'ok'|'erro'|'carregando'>('carregando')
  const [stats, setStats] = useState({
    messages: 0,
    conversations: 0,
    responseTime: '0min',
    whatsappStatus: 'offline'
  })
  const [messagesByDay, setMessagesByDay] = useState<{ label: string; count: number }[]>([])
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])
  const [loadingPanel, setLoadingPanel] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoadingPanel(true)
      try {
        const r = await health()
        setStatus(r.ok ? 'ok' : 'erro')
        if (r.ok && token) {
          const s = await getStats(token)
          if (!mounted) return
          const d = s?.data || {}
          setStats({
            messages: d.messagesToday ?? 0,
            conversations: d.conversations ?? 0,
            responseTime: d.responseTime ? `${d.responseTime}min` : '0min',
            whatsappStatus: d.whatsappStatus ?? 'offline'
          })

          // Mensagens últimos 7 dias (reais via /messages/count)
          const days: { label: string; start: Date; end: Date }[] = []
          for (let i = 0; i < 7; i++) {
            const day = new Date()
            day.setDate(day.getDate() - i)
            const start = new Date(day)
            start.setHours(0,0,0,0)
            const end = new Date(day)
            end.setHours(23,59,59,999)
            days.push({
              label: i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : `${i} dias atrás`,
              start, end
            })
          }
          const counts: { label: string; count: number }[] = []
          for (const dday of days) {
            const res = await fetch(`/api/messages/count?start=${dday.start.toISOString()}&end=${dday.end.toISOString()}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            const json = await res.json().catch(() => ({}))
            counts.push({ label: dday.label, count: json?.count ?? 0 })
          }
          if (mounted) setMessagesByDay(counts.reverse())

          // Campanhas recentes reais
          const c = await getCampaigns(token).catch(() => ({ campaigns: [] }))
          if (mounted) setRecentCampaigns((c?.campaigns || []).slice(0, 5))
        }
      } catch (e) {
        setStatus('erro')
      } finally { setLoadingPanel(false) }
    }
    load()
    return () => { mounted = false }
  }, [token])

  const isConnected = status === 'ok' && stats.whatsappStatus === 'online'

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-text-muted mt-1">
                Visão geral do seu atendimento WhatsApp
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={status === 'ok' ? 'success' : 'error'}>
                API {status === 'carregando' ? 'Carregando...' : status === 'ok' ? 'Online' : 'Offline'}
              </Badge>
              {!isConnected && (
                <button className="btn btn-primary animate-glow">
                  <WhatsappIcon className="w-4 h-4 mr-2" />
                  Conectar WhatsApp
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Mensagens Hoje"
              value={status === 'carregando' ? '...' : <AnimatedCounter value={stats.messages} />}
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Conversas Abertas"
              value={status === 'carregando' ? '...' : <AnimatedCounter value={stats.conversations} />}
              icon={<ContactsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Tempo de Resposta"
              value={status === 'carregando' ? '...' : stats.responseTime}
              icon={<ReportsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Status WhatsApp"
              value={
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {isConnected ? 'Online' : 'Offline'}
                </div>
              }
              icon={<WhatsappIcon className="w-6 h-6" />}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Mensagens por Dia</h3>
                <span className="text-sm text-text-muted">Últimos 7 dias</span>
              </div>
              {status === 'carregando' ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
                </div>
              ) : isConnected ? (
                <div className="space-y-4">
                  {messagesByDay.length === 0 ? (
                    <div className="text-sm text-text-muted">Sem dados ainda.</div>
                  ) : (
                    messagesByDay.map((d) => (
                      <div key={d.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{d.label}</span>
                          <span className="font-medium">{d.count}</span>
                        </div>
                        <ProgressBar value={d.count} max={Math.max(...messagesByDay.map(m => m.count), 1)} />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<ReportsIcon className="w-8 h-8" />}
                  title="Sem dados disponíveis"
                  description="Conecte seu WhatsApp para ver estatísticas detalhadas"
                />
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Campanhas Recentes</h3>
                <button className="text-emerald-400 text-sm hover:text-emerald-300">
                  Ver todas
                </button>
              </div>
              {status === 'carregando' ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-800 rounded animate-pulse" />
                        <div className="h-2 bg-slate-800 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isConnected ? (
                <EmptyState
                  icon={<CampaignsIcon className="w-8 h-8" />}
                  title="Nenhuma campanha"
                  description="Conecte seu WhatsApp e crie sua primeira campanha"
                  action={{
                    label: 'Criar Campanha',
                    onClick: () => window.location.href = '/campanhas'
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {recentCampaigns.length === 0 ? (
                    <div className="text-sm text-text-muted">Nenhuma campanha encontrada.</div>
                  ) : (
                    recentCampaigns.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <CampaignsIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{c.name || c.title || `Campanha ${c.id}`}</div>
                          <div className="text-sm text-text-muted">{c.totalSent ? `${c.totalSent} enviadas` : ''} {c.deliveredRate ? `• ${Math.round(c.deliveredRate*100)}% entregue` : ''}</div>
                        </div>
                        <Badge variant={c.status === 'active' ? 'success' : c.status === 'completed' ? 'default' : 'default'}>
                          {c.status || '—'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-700/30 transition-all duration-200 hover:scale-105">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <InboxIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Abrir Inbox</div>
                  <div className="text-sm text-text-muted">Atender clientes</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-700/30 transition-all duration-200 hover:scale-105">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CampaignsIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Nova Campanha</div>
                  <div className="text-sm text-text-muted">Enviar mensagens</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl hover:bg-slate-700/30 transition-all duration-200 hover:scale-105">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <ReportsIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Relatórios</div>
                  <div className="text-sm text-text-muted">Ver métricas</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
