'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { EmptyState, Badge, StatCard, ProgressBar } from '@/components/UI'
import { CampaignsIcon } from '@/components/Icons'
import { useAuth } from '@/lib/auth'
import { getCampaigns, createCampaign, deleteCampaign } from '@/lib/api'

interface Campaign {
  id: number
  name: string
  status: 'active' | 'completed' | 'paused' | 'draft'
  totalMessages: number
  sentMessages: number
  deliveryRate: number
  openRate: number
  createdAt: string
  updatedAt: string
  scheduledAt?: string
}

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    scheduledAt: ''
  })
  const { token } = useAuth()

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getCampaigns(token)
      setCampaigns(data.campaigns)
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      await createCampaign(token, { name: newCampaign.name, scheduledAt: newCampaign.scheduledAt || null })
      await loadCampaigns()
      setNewCampaign({ name: '', scheduledAt: '' })
      setShowCreateModal(false)
    } catch (e: any) {
      setError(e.message || 'Falha ao criar campanha')
    }
  }

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta campanha?')) return
    if (!token) return
    try {
      await deleteCampaign(token, id)
      await loadCampaigns()
    } catch (e: any) {
      setError(e.message || 'Falha ao remover campanha')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'completed': return 'secondary'
      case 'paused': return 'warning'
      case 'draft': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa'
      case 'completed': return 'Concluída'
      case 'paused': return 'Pausada'
      case 'draft': return 'Rascunho'
      default: return status
    }
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
  const totalMessages = campaigns.reduce((sum, c) => sum + c.sentMessages, 0)
  const avgDeliveryRate = campaigns.length > 0 
    ? campaigns.reduce((sum, c) => sum + c.deliveryRate, 0) / campaigns.length 
    : 0

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Nova Campanha
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total de Campanhas" value={campaigns.length} icon={<CampaignsIcon />} />
                <StatCard title="Campanhas Ativas" value={activeCampaigns} />
                <StatCard title="Mensagens Enviadas" value={totalMessages} />
                <StatCard title="Taxa de Entrega Média" value={`${avgDeliveryRate.toFixed(1)}%`} />
              </div>

              {/* Lista de Campanhas */}
              {campaigns.length === 0 ? (
                <EmptyState
                  icon={<CampaignsIcon />}
                  title="Nenhuma campanha encontrada"
                  description="Crie sua primeira campanha para começar a enviar mensagens em massa para seus contatos."
                  action={{
                    label: "Criar Campanha",
                    onClick: () => setShowCreateModal(true)
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campanha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progresso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Métricas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{campaign.name}</div>
                                {campaign.scheduledAt && (
                                  <div className="text-sm text-gray-500">
                                    Agendada: {new Date(campaign.scheduledAt).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={getStatusColor(campaign.status) as any}>
                                {getStatusLabel(campaign.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{campaign.sentMessages} / {campaign.totalMessages}</span>
                                  <span>{campaign.totalMessages > 0 ? Math.round((campaign.sentMessages / campaign.totalMessages) * 100) : 0}%</span>
                                </div>
                                <ProgressBar value={campaign.totalMessages > 0 ? (campaign.sentMessages / campaign.totalMessages) * 100 : 0} />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm space-y-1">
                                <div>Entrega: {campaign.deliveryRate.toFixed(1)}%</div>
                                <div>Abertura: {campaign.openRate.toFixed(1)}%</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => console.log('Ver relatório', campaign.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <span className="text-text-muted">Relatório</span>
                                </button>
                                <button
                                  onClick={() => console.log('Editar', campaign.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <span className="text-text-muted">Editar</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <span className="text-text-muted">Excluir</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Criar Campanha */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Nova Campanha</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome da Campanha *</label>
                    <input
                      type="text"
                      required
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Ex: Promoção de Verão 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Agendamento (opcional)</label>
                    <input
                      type="datetime-local"
                      value={newCampaign.scheduledAt}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deixe em branco para criar como rascunho
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
