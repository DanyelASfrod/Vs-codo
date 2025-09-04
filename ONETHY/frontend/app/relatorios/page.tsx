'use client'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { StatCard, ProgressBar, Badge } from '@/components/UI'
import { ReportsIcon, InboxIcon, ContactsIcon, CampaignsIcon } from '@/components/Icons'
import { useEffect, useState } from 'react'

export default function RelatoriosPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    async function fetchReport() {
      setLoading(true)
      try {
        const res = await fetch('/api/reports', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setReport(data)
        setLoading(false)
      } catch {
        setReport(null)
        setLoading(false)
      }
    }
    fetchReport()
  }, [token])

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Carregando relatórios...</div>
  }

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                Relatórios
              </h1>
              <p className="text-text-muted">Acompanhe suas métricas e desempenho</p>
            </div>
            <button className="btn btn-primary">
              <ReportsIcon className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Mensagens Enviadas"
              value={report?.sentMessages ?? 0}
              change={{ value: report?.sentChange ?? '+0%', positive: true }}
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Taxa de Entrega"
              value={report?.deliveryRate ?? '0%'}
              change={{ value: report?.deliveryChange ?? '+0%', positive: true }}
              icon={<ReportsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Taxa de Abertura"
              value={report?.openRate ?? '0%'}
              change={{ value: report?.openChange ?? '+0%', positive: true }}
              icon={<ContactsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Conversões"
              value={report?.conversionRate ?? '0%'}
              change={{ value: report?.conversionChange ?? '+0%', positive: true }}
              icon={<CampaignsIcon className="w-6 h-6" />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Mensagens por Dia</h3>
              <div className="space-y-4">
                {report?.messagesByDay?.map((row: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{row.label}</span>
                    <div className="flex-1 mx-4">
                      <ProgressBar value={row.value} max={row.max ?? 1000} />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Desempenho de Campanhas</h3>
              <div className="space-y-4">
                {report?.campaigns?.map((camp: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{camp.name}</h4>
                      <Badge variant={camp.active ? 'success' : 'default'}>{camp.active ? 'Ativa' : 'Concluída'}</Badge>
                    </div>
                    <div className="text-sm text-text-muted mb-2">{camp.sent} enviadas • {camp.delivered} entregues</div>
                    <ProgressBar value={camp.delivered} max={camp.sent} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Métricas Detalhadas</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3">Métrica</th>
                    <th className="text-left py-3">Hoje</th>
                    <th className="text-left py-3">Ontem</th>
                    <th className="text-left py-3">7 Dias</th>
                    <th className="text-left py-3">30 Dias</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {report?.metrics?.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-800">
                      <td className="py-3">{row.label}</td>
                      <td className="py-3">{row.today}</td>
                      <td className="py-3">{row.yesterday}</td>
                      <td className="py-3">{row.sevenDays}</td>
                      <td className="py-3">{row.thirtyDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
