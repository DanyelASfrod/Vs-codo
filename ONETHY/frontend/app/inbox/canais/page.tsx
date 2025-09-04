'use client'

import React, { useState, useEffect } from 'react'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button, Badge, EmptyState, StatCard, AnimatedCounter } from '@/components/UI'
import { WhatsappIcon, InboxIcon } from '@/components/Icons'
import { channelsService } from '@/lib/channels-api'

interface Channel {
  id: number
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  phone?: string
  webhook?: string
  config?: any
  messagesCount: number
  lastActivity?: string
  createdAt: string
  updatedAt: string
}

const statusConfig = {
  connected: { 
    label: 'Conectado', 
    color: 'success', 
    dot: 'bg-emerald-500',
    pulse: 'animate-pulse bg-emerald-500/20'
  },
  disconnected: { 
    label: 'Desconectado', 
    color: 'default', 
    dot: 'bg-slate-500',
    pulse: ''
  },
  connecting: { 
    label: 'Conectando...', 
    color: 'warning', 
    dot: 'bg-yellow-500',
    pulse: 'animate-pulse bg-yellow-500/20'
  },
  error: { 
    label: 'Erro de Conexão', 
    color: 'error', 
    dot: 'bg-red-500',
    pulse: 'animate-pulse bg-red-500/20'
  }
} as const

export default function CanaisPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)
  const [newConnectionName, setNewConnectionName] = useState('')
  const [newConnectionPhone, setNewConnectionPhone] = useState('')
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null)
  const [currentInstanceName, setCurrentInstanceName] = useState<string | null>(null)
  const [operationLoading, setOperationLoading] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadChannels()

    // Auto refresh a cada 30 segundos - APENAS se não estiver em operação
    const interval = setInterval(() => {
      if (!operationLoading && !showQRCode && !showCreateModal) {
        loadChannels(true)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, []) // Remove dependências que causam recarregamento

  // Função para forçar refresh dos dados
  const forceRefreshChannels = async (): Promise<Channel[]> => {
    try {
      console.log('🔄 Force refresh - buscando dados frescos...')
      const freshData = await channelsService.getChannels()
      
      if (freshData && Array.isArray(freshData)) {
        setChannels(freshData) // Atualiza o estado também
        console.log('✅ Estado atualizado com dados frescos')
        return freshData
      } else {
        throw new Error('Dados inválidos recebidos')
      }
    } catch (error) {
      console.error('❌ Erro no force refresh:', error)
      throw error
    }
  }

  const loadChannels = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const data = await channelsService.getChannels()

      if (data && Array.isArray(data)) {
        setChannels(data)
        if (!silent) {
          console.log('📊 Canais carregados:', data.length)
          console.log('📋 Lista:', data.map(c => ({
            id: c.id,
            name: c.name,
            evolutionInstance: c.config?.evolutionInstance,
            status: c.status
          })))
        }
      } else {
        console.error('❌ Resposta inválida de getChannels:', data)
        setChannels([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar canais:', error)
      setChannels([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const createConnection = async () => {
    try {
      setOperationLoading('creating')
      // Cria instância WhatsApp usando o nome do cliente como nome da instância
      const response = await channelsService.createWhatsAppInstance({
        name: newConnectionName, // O nome da instância será igual ao nome do cliente
        phone: newConnectionPhone
      })

      console.log('Debug - Resposta da criação:', response)
      console.log('Debug - Detalhes da resposta:', {
        instanceName: response?.instanceName,
        channelConfig: response?.channel?.config,
        channelName: response?.channel?.name
      })
      
      // Determina o nome da instância de forma mais robusta
      let instanceName = null
      if (response?.instanceName) {
        instanceName = response.instanceName
        console.log('Debug - Usando instanceName da resposta:', instanceName)
      } else if (response?.channel?.config?.evolutionInstance) {
        instanceName = response.channel.config.evolutionInstance
        console.log('Debug - Usando evolutionInstance do canal:', instanceName)
      } else if (response?.channel?.name) {
        // Fallback: usa o nome do canal sanitizado
        instanceName = response.channel.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() + '_1'
        console.log('Debug - Fallback usando nome do canal:', instanceName)
      } else {
        // Último fallback: cria um nome baseado no input do usuário
        instanceName = newConnectionName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() + '_1'
        console.log('Debug - Último fallback usando input do usuário:', instanceName)
      }

      console.log('Debug - Nome da instância determinado:', instanceName)

      // Se a API já devolver o QR, mostramos direto
      if (response?.qrcode) {
        setCurrentQRCode(response.qrcode)
        setCurrentInstanceName(instanceName)
        setShowQRCode(response.qrcode)
      } else if (instanceName) {
        // Conecta para gerar QR
        console.log('Debug - Conectando para gerar QR:', instanceName)
        try {
          const connectRes = await channelsService.connectWhatsAppInstance(instanceName)
          if (connectRes?.qrcode) {
            setCurrentQRCode(connectRes.qrcode)
            setCurrentInstanceName(instanceName)
            setShowQRCode(connectRes.qrcode)
          } else {
            // Se não conseguiu conectar, pelo menos define o instanceName
            setCurrentInstanceName(instanceName)
            console.warn('Debug - Não conseguiu gerar QR, mas definiu instanceName:', instanceName)
          }
        } catch (e) {
          console.error('Erro ao conectar automaticamente após criação:', e)
          // Mesmo com erro, define o instanceName para permitir atualização posterior
          setCurrentInstanceName(instanceName)
        }
      }

      setShowCreateModal(false)
      setNewConnectionName('')
      setNewConnectionPhone('')
      // Apenas sincroniza status sem reload completo
      await channelsService.syncInstances()
    } catch (error) {
      console.error('Erro ao criar conexão:', error)
      alert('Erro ao criar conexão')
    } finally {
      setOperationLoading(null)
    }
  }

  const connectInstance = async (channel: Channel) => {
    console.log('Debug - connectInstance chamado:', {
      channelId: channel.id,
      channelName: channel.name,
      evolutionInstance: channel.config?.evolutionInstance
    })
    if (!channel.config?.evolutionInstance) {
      alert('Instância Evolution não encontrada para este canal. Não é possível conectar.');
      return;
    }
    try {
      setOperationLoading(`connect-${channel.id}`)
      const response = await channelsService.connectWhatsAppInstance(channel.config.evolutionInstance)

      if (response?.qrcode) {
        setCurrentQRCode(response.qrcode)
        setCurrentInstanceName(channel.config.evolutionInstance)
        setShowQRCode(response.qrcode)
      }

      // Apenas sincroniza status sem reload completo
      await channelsService.syncInstances()
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error)
      let msg = 'Erro ao conectar instância.'
      if (error?.message) msg += `\n${error.message}`
      alert(msg)
    } finally {
      // Limpa apenas o loading do botão
      setOperationLoading((prev) => prev === `connect-${channel.id}` ? null : prev)
    }
  }

  const restartInstance = async (channel: Channel) => {
    try {
      setOperationLoading(`restart-${channel.id}`)
      await channelsService.restartWhatsAppInstance(channel.config?.evolutionInstance)
      await channelsService.syncInstances()
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error)
      alert('Erro ao reiniciar instância')
    } finally {
      setOperationLoading((prev) => prev === `restart-${channel.id}` ? null : prev)
    }
  }

  const disconnectInstance = async (channel: Channel) => {
    try {
      setOperationLoading(`disconnect-${channel.id}`)
      await channelsService.logoutWhatsAppInstance(channel.config?.evolutionInstance)
      await channelsService.syncInstances()
    } catch (error) {
      console.error('Erro ao desconectar instância:', error)
      alert('Erro ao desconectar instância')
    } finally {
      setOperationLoading((prev) => prev === `disconnect-${channel.id}` ? null : prev)
    }
  }

  const deleteConnection = async (channelId: number) => {
    if (!confirm('Tem certeza que deseja deletar esta conexão? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setOperationLoading(`delete-${channelId}`)
      await channelsService.deleteChannel(channelId)
      // Recarrega apenas após deletar
      await loadChannels()
    } catch (error) {
      console.error('Erro ao deletar canal:', error)
      alert('Erro ao deletar canal')
    } finally {
      setOperationLoading((prev) => prev === `delete-${channelId}` ? null : prev)
    }
  }

  const syncInstances = async () => {
    try {
      setOperationLoading('sync')
      await channelsService.syncInstances()
      // Recarrega apenas após sincronização manual
      await loadChannels()
    } catch (error) {
      console.error('Erro ao sincronizar instâncias:', error)
      alert('Erro ao sincronizar instâncias')
    } finally {
      setOperationLoading(null)
    }
  }

  const connectedChannels = channels.filter(c => c.status === 'connected').length
  const totalMessages = channels.reduce((acc, c) => acc + c.messagesCount, 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <Shell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-muted">Carregando conexões...</p>
            </div>
          </div>
        </Shell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-6">
          {/* Header com estatísticas */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Canais WhatsApp</h1>
              <p className="text-text-muted">Gerencie suas conexões e monitore o status</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                onClick={syncInstances}
                disabled={operationLoading === 'sync'}
                className="hover:scale-105 transition-transform"
              >
                {operationLoading === 'sync' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <InboxIcon className="w-4 h-4 mr-2" />
                )}
                Sincronizar
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={!!operationLoading}
                className="hover:scale-105 transition-transform"
              >
                <WhatsappIcon className="w-4 h-4 mr-2" />
                Nova Conexão
              </Button>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Conexões Ativas"
              value={<AnimatedCounter value={connectedChannels} />}
              change={{
                value: `${channels.length} total`,
                positive: connectedChannels > 0
              }}
              icon={<WhatsappIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Mensagens Processadas"
              value={<AnimatedCounter value={totalMessages} />}
              change={{
                value: "últimas 24h",
                positive: true
              }}
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Status Geral"
              value={`${Math.round((connectedChannels / (channels.length || 1)) * 100)}%`}
              change={{
                value: "disponibilidade",
                positive: connectedChannels > channels.length / 2
              }}
              icon={
                <div className={`w-3 h-3 rounded-full ${connectedChannels > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
              }
            />
          </div>

          {/* Lista de canais */}
          <div className="card">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Conexões Ativas</h2>
                <div className="flex items-center gap-2">
                  {refreshing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                  <span className="text-sm text-text-muted">
                    Atualizado automaticamente
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {channels.length === 0 ? (
                <EmptyState
                  icon={<WhatsappIcon className="w-8 h-8" />}
                  title="Nenhuma conexão encontrada"
                  description="Crie sua primeira conexão WhatsApp para começar a receber mensagens."
                  action={{
                    label: "Criar Primeira Conexão",
                    onClick: () => setShowCreateModal(true)
                  }}
                />
              ) : (
                channels.map((channel, index) => {
                  const status = statusConfig[channel.status]
                  const isOperating = operationLoading?.includes(channel.id.toString())
                  // Detecta se está travado em connecting há mais de 1 minuto
                  const connectingStuck = channel.status === 'connecting' && channel.lastActivity && (Date.now() - new Date(channel.lastActivity).getTime() > 60000)
                  const missingInstance = !channel.config?.evolutionInstance
                  return (
                    <div 
                      key={channel.id} 
                      className={`p-6 hover:bg-slate-800/50 transition-all duration-300 transform hover:scale-[1.01] ${
                        index === 0 ? 'animate-fade-in' : ''
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative p-3 bg-green-500/20 rounded-xl">
                            <WhatsappIcon className="w-6 h-6 text-green-400" />
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${status.dot}`}> 
                              {status.pulse && <div className={`absolute inset-0 rounded-full ${status.pulse}`}></div>}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-white mb-1">{channel.name}</h3>
                            {channel.phone && (
                              <p className="text-sm text-text-muted mb-2">{channel.phone}</p>
                            )}
                            <div className="flex items-center gap-3">
                              <Badge variant={status.color as any}>
                                {status.label}
                              </Badge>
                              {channel.webhook && (
                                <Badge variant="default">
                                  Webhook Ativo
                                </Badge>
                              )}
                            </div>
                            {connectingStuck && (
                              <div className="mt-2 text-xs text-yellow-400">
                                Status travado em "Conectando...". <br />
                                <Button size="xs" variant="secondary" onClick={syncInstances} className="ml-2">Atualizar Status</Button>
                              </div>
                            )}
                            {missingInstance && (
                              <div className="mt-2 text-xs text-red-400">
                                Instância Evolution não encontrada.<br />
                                <span className="font-semibold">Sincronize ou crie novamente a conexão.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Informações adicionais */}
                          <div className="text-right mr-4 hidden sm:block">
                            <div className="text-sm font-medium text-white">
                              <AnimatedCounter value={channel.messagesCount} /> msgs
                            </div>
                            {channel.lastActivity && (
                              <div className="text-xs text-text-muted">
                                {new Date(channel.lastActivity).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>

                          {/* Botões de ação */}
                          <div className="flex items-center gap-2">
                            {channel.status === 'disconnected' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  if (!channel.config?.evolutionInstance) {
                                    alert('Instância Evolution não encontrada para este canal. Não é possível conectar.');
                                    return;
                                  }
                                  connectInstance(channel)
                                }}
                                disabled={isOperating || !channel.config?.evolutionInstance}
                                className="hover:scale-105 transition-transform"
                              >
                                {operationLoading === `connect-${channel.id}` ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                ) : (
                                  'Conectar'
                                )}
                              </Button>
                            )}

                            {channel.status === 'connected' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => restartInstance(channel)}
                                  disabled={isOperating}
                                  className="hover:scale-105 transition-transform"
                                >
                                  {operationLoading === `restart-${channel.id}` ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                  ) : (
                                    'Reiniciar'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => disconnectInstance(channel)}
                                  disabled={isOperating}
                                  className="hover:scale-105 transition-transform border-red-600 text-red-400 hover:bg-red-600"
                                >
                                  {operationLoading === `disconnect-${channel.id}` ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                  ) : (
                                    'Desconectar'
                                  )}
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteConnection(channel.id)}
                              disabled={isOperating}
                              className="hover:scale-105 transition-transform border-red-600 text-red-400 hover:bg-red-600"
                            >
                              {operationLoading === `delete-${channel.id}` ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                              ) : (
                                'Deletar'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal de criação */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-800 animate-scale-in shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6">Nova Conexão WhatsApp</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Nome da Conexão *
                  </label>
                  <input
                    type="text"
                    value={newConnectionName}
                    onChange={(e) => setNewConnectionName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-text-muted transition-all duration-200"
                    placeholder="Ex: WhatsApp Principal"
                    disabled={operationLoading === 'creating'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Número (opcional)
                  </label>
                  <input
                    type="text"
                    value={newConnectionPhone}
                    onChange={(e) => setNewConnectionPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-text-muted transition-all duration-200"
                    placeholder="Ex: +55 11 99999-9999"
                    disabled={operationLoading === 'creating'}
                  />
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-text-muted">
                    <strong>Importante:</strong> Após criar a conexão, um QR Code será exibido para você escanear com o WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewConnectionName('')
                    setNewConnectionPhone('')
                  }}
                  disabled={operationLoading === 'creating'}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createConnection}
                  disabled={!newConnectionName.trim() || operationLoading === 'creating'}
                  className="hover:scale-105 transition-transform"
                >
                  {operationLoading === 'creating' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    'Criar Conexão'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal QR Code */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-slate-900 rounded-xl p-8 w-full max-w-lg border border-slate-800 animate-scale-in shadow-2xl text-center">
              <div className="mb-6">
                <WhatsappIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Conectar WhatsApp</h2>
                <p className="text-text-muted">Escaneie o QR Code com seu WhatsApp</p>
              </div>
              
              <div className="mb-6 bg-white p-4 rounded-xl inline-block">
                <img 
                  src={typeof currentQRCode === 'string' ? currentQRCode : ''} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-white mb-2">Como conectar:</h3>
                <ol className="text-sm text-text-muted text-left space-y-1">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Toque em Menu (⋮) &gt; Dispositivos conectados</li>
                  <li>3. Toque em &quot;Conectar um dispositivo&quot;</li>
                  <li>4. Escaneie este código QR</li>
                </ol>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    console.log('🔄 INICIANDO Update QR Code')
                    
                    try {
                      // ABORDAGEM DIRETA: busca qualquer canal disponível
                      const allChannels = await channelsService.getChannels()
                      console.log('📡 Todos os canais:', allChannels)
                      
                      if (!allChannels || allChannels.length === 0) {
                        alert('Nenhum canal encontrado. Crie uma nova conexão.')
                        return
                      }
                      
                      // Busca o primeiro canal com evolutionInstance
                      const targetChannel = allChannels.find(c => c.config?.evolutionInstance) || allChannels[0]
                      
                      if (!targetChannel) {
                        alert('Nenhum canal válido encontrado.')
                        return
                      }
                      
                      console.log('🎯 Usando canal:', {
                        id: targetChannel.id,
                        name: targetChannel.name,
                        evolutionInstance: targetChannel.config?.evolutionInstance
                      })
                      
                      // Se tem evolutionInstance, conecta
                      if (targetChannel.config?.evolutionInstance) {
                        console.log('🚀 Conectando com:', targetChannel.config.evolutionInstance)
                        const response = await channelsService.connectWhatsAppInstance(targetChannel.config.evolutionInstance)
                        
                        if (response?.qrcode) {
                          console.log('✅ QR Code recebido!')
                          setCurrentQRCode(response.qrcode)
                          setCurrentInstanceName(targetChannel.config.evolutionInstance)
                          setShowQRCode(response.qrcode)
                        } else {
                          alert('Erro: Não foi possível gerar QR Code.')
                        }
                      } else {
                        alert('Canal não possui instância ativa. Sincronize ou crie nova conexão.')
                      }
                      
                    } catch (error) {
                      console.error('💥 Erro:', error)
                      alert('Erro: ' + (error as Error).message)
                    }
                  }}
                  className="hover:scale-105 transition-transform"
                >
                  Atualizar QR Code
                </Button>
                    
                    if (!currentInstanceName) {
                      alert('Nome da instância não definido. Tente criar a conexão novamente.')
                      return
                    }

                    try {
                      // NOVA ABORDAGEM: Carrega dados frescos diretamente da API
                      console.log('� Buscando canais frescos da API...')
                      const freshChannels = await channelsService.getChannels()
                      
                      console.log('📊 Canais frescos recebidos:', freshChannels.map(c => ({
                        id: c.id,
                        name: c.name,
                        evolutionInstance: c.config?.evolutionInstance,
                        status: c.status
                      })))

                      // Busca o canal correto nos dados frescos
                      let targetChannel = freshChannels.find(c => c.config?.evolutionInstance === currentInstanceName)
                      
                      if (!targetChannel) {
                        console.log('⚠️ Busca exata falhou, tentando alternativas...')
                        // Tenta buscar por qualquer canal com evolutionInstance
                        targetChannel = freshChannels.find(c => c.config?.evolutionInstance)
                        
                        if (targetChannel) {
                          console.log('🔄 Usando canal alternativo e atualizando currentInstanceName:', {
                            de: currentInstanceName,
                            para: targetChannel.config.evolutionInstance
                          })
                          setCurrentInstanceName(targetChannel.config.evolutionInstance)
                        }
                      }

                      if (targetChannel) {
                        console.log('✅ Canal encontrado, conectando:', {
                          id: targetChannel.id,
                          name: targetChannel.name,
                          evolutionInstance: targetChannel.config?.evolutionInstance
                        })
                        
                        // Conecta diretamente sem depender do estado local
                        const response = await channelsService.connectWhatsAppInstance(targetChannel.config.evolutionInstance)
                        
                        if (response?.qrcode) {
                          console.log('🎉 Novo QR Code recebido!')
                          setCurrentQRCode(response.qrcode)
                          setShowQRCode(response.qrcode)
                        } else {
                          console.warn('⚠️ Resposta sem QR Code:', response)
                          alert('Não foi possível gerar um novo QR Code. Tente novamente.')
                        }
                      } else {
                        console.error('❌ Nenhum canal encontrado com evolutionInstance')
                        alert('Nenhum canal ativo encontrado. Crie uma nova conexão.')
                      }
                      
                    } catch (error) {
                      console.error('💥 Erro ao atualizar QR Code:', error)
                      alert('Erro ao atualizar QR Code: ' + (error as Error).message)
                    }
                  }}
                  disabled={!currentInstanceName}
                  className="hover:scale-105 transition-transform"
                >
                  Atualizar QR Code
                </Button>
                <Button
                  onClick={async () => {
                    setShowQRCode(null)
                    setCurrentQRCode(null)
                    setCurrentInstanceName(null)
                    // Apenas sincroniza sem reload completo
                    setOperationLoading('sync')
                    await channelsService.syncInstances()
                    setOperationLoading(null)
                  }}
                  className="hover:scale-105 transition-transform"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Shell>
    </ProtectedRoute>
  )
}
