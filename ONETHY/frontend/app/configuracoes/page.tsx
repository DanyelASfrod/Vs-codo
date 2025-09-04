'use client'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Badge, StatCard } from '@/components/UI'
import { ContactsIcon, WhatsappIcon, InboxIcon, CampaignsIcon } from '@/components/Icons'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/Toast'
import { me } from '@/lib/api'

interface UserSettings {
  name: string
  email: string
  company: string
  phone: string
  timezone: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    shareData: boolean
    showOnlineStatus: boolean
  }
}

interface SystemSettings {
  autoResponse: boolean
  workingHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  messageLimit: number
  webhookUrl: string
  apiKey: string
}

export default function ConfiguracoesPage(){
  const { token } = useAuth()
  const toast = useToast()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'integrations' | 'billing'>('profile')
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    email: '',
    company: '',
    phone: '',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      shareData: false,
      showOnlineStatus: true
    }
  })
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoResponse: true,
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '18:00',
      timezone: 'America/Sao_Paulo'
    },
    messageLimit: 1000,
    webhookUrl: '',
    apiKey: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
          const userData = await res.json()
          setUser(userData)
          setUserSettings(prev => ({
            ...prev,
            name: userData.name || '',
            email: userData.email || '',
          }))
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error)
        }
      }
    }
    loadUser()
  }, [token])

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast && toast('Perfil atualizado com sucesso!', 'success')
    } catch (error) {
      toast && toast('Erro ao salvar perfil', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystem = async () => {
    setLoading(true)
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast && toast('Configurações do sistema atualizadas!', 'success')
    } catch (error) {
      toast && toast('Erro ao salvar configurações', 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = () => {
    const newApiKey = 'onethy_' + Math.random().toString(36).substr(2, 24)
    setSystemSettings(prev => ({ ...prev, apiKey: newApiKey }))
    toast && toast('Nova chave API gerada!', 'success')
  }

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-text-muted mt-1">
                Gerencie suas preferências e configurações do sistema
              </p>
            </div>
            <Badge variant="success">
              {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Conta Criada"
              value="15 dias atrás"
              icon={<ContactsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Último Login"
              value="Agora"
              icon={<WhatsappIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Configurações"
              value="85% completas"
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Backup"
              value="Automático"
              icon={<CampaignsIcon className="w-6 h-6" />}
            />
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-slate-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'profile', label: 'Perfil', icon: <ContactsIcon className="w-4 h-4" /> },
                  { id: 'system', label: 'Sistema', icon: <InboxIcon className="w-4 h-4" /> },
                  { id: 'integrations', label: 'Integrações', icon: <WhatsappIcon className="w-4 h-4" /> },
                  { id: 'billing', label: 'Cobrança', icon: <CampaignsIcon className="w-4 h-4" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={userSettings.name}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                        className="input w-full"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="input w-full"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Empresa
                      </label>
                      <input
                        type="text"
                        value={userSettings.company}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, company: e.target.value }))}
                        className="input w-full"
                        placeholder="Nome da sua empresa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={userSettings.phone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                        className="input w-full"
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fuso Horário
                      </label>
                      <select
                        value={userSettings.timezone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="America/New_York">Nova York (GMT-5)</option>
                        <option value="Europe/London">Londres (GMT+0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Idioma
                      </label>
                      <select
                        value={userSettings.language}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notificações</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(userSettings.notifications).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setUserSettings(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [key]: e.target.checked }
                            }))}
                            className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-400 focus:ring-2"
                          />
                          <span className="capitalize text-slate-300">
                            {key === 'email' ? 'Email' : key === 'push' ? 'Push' : 'SMS'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Privacidade</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={userSettings.privacy.shareData}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, shareData: e.target.checked }
                          }))}
                          className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-400 focus:ring-2"
                        />
                        <span className="text-slate-300">Compartilhar dados para melhorar o serviço</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={userSettings.privacy.showOnlineStatus}
                          onChange={(e) => setUserSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showOnlineStatus: e.target.checked }
                          }))}
                          className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-400 focus:ring-2"
                        />
                        <span className="text-slate-300">Mostrar status online</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.autoResponse}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, autoResponse: e.target.checked }))}
                          className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-400 focus:ring-2"
                        />
                        <div>
                          <span className="font-medium text-white">Resposta Automática</span>
                          <p className="text-sm text-slate-400">Responder automaticamente quando offline</p>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={systemSettings.workingHours.enabled}
                          onChange={(e) => setSystemSettings(prev => ({ 
                            ...prev, 
                            workingHours: { ...prev.workingHours, enabled: e.target.checked }
                          }))}
                          className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-400 focus:ring-2"
                        />
                        <div>
                          <span className="font-medium text-white">Horário de Funcionamento</span>
                          <p className="text-sm text-slate-400">Definir horários de atendimento</p>
                        </div>
                      </label>
                      
                      {systemSettings.workingHours.enabled && (
                        <div className="grid grid-cols-2 gap-4 ml-7">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Início
                            </label>
                            <input
                              type="time"
                              value={systemSettings.workingHours.start}
                              onChange={(e) => setSystemSettings(prev => ({ 
                                ...prev, 
                                workingHours: { ...prev.workingHours, start: e.target.value }
                              }))}
                              className="input w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Fim
                            </label>
                            <input
                              type="time"
                              value={systemSettings.workingHours.end}
                              onChange={(e) => setSystemSettings(prev => ({ 
                                ...prev, 
                                workingHours: { ...prev.workingHours, end: e.target.value }
                              }))}
                              className="input w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Limite de Mensagens por Mês
                      </label>
                      <input
                        type="number"
                        value={systemSettings.messageLimit}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, messageLimit: parseInt(e.target.value) || 0 }))}
                        className="input w-full max-w-xs"
                        min="0"
                      />
                      <p className="text-sm text-slate-400 mt-1">
                        Define o limite de mensagens que podem ser enviadas por mês
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        URL do Webhook
                      </label>
                      <input
                        type="url"
                        value={systemSettings.webhookUrl}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        className="input w-full"
                        placeholder="https://api.exemplo.com/webhook"
                      />
                      <p className="text-sm text-slate-400 mt-1">
                        Receba notificações em tempo real sobre eventos do sistema
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSystem}
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Integrações e APIs</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Chave da API
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={systemSettings.apiKey}
                          readOnly
                          className="input flex-1 bg-slate-800"
                          placeholder="Clique em 'Gerar' para criar uma chave"
                        />
                        <button
                          onClick={generateApiKey}
                          className="btn btn-secondary"
                        >
                          Gerar Nova
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        Use esta chave para integrar com APIs externas
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="card p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <WhatsappIcon className="w-6 h-6 text-emerald-400" />
                          <div>
                            <h4 className="font-medium">Evolution API</h4>
                            <p className="text-sm text-slate-400">Conectado</p>
                          </div>
                        </div>
                        <Badge variant="success">Ativo</Badge>
                        <button className="btn btn-outline btn-sm mt-3 w-full">
                          Configurar
                        </button>
                      </div>

                      <div className="card p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <CampaignsIcon className="w-6 h-6 text-slate-400" />
                          <div>
                            <h4 className="font-medium">Mercado Pago</h4>
                            <p className="text-sm text-slate-400">Desconectado</p>
                          </div>
                        </div>
                        <Badge variant="error">Inativo</Badge>
                        <button className="btn btn-primary btn-sm mt-3 w-full">
                          Conectar
                        </button>
                      </div>

                      <div className="card p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <InboxIcon className="w-6 h-6 text-slate-400" />
                          <div>
                            <h4 className="font-medium">Zapier</h4>
                            <p className="text-sm text-slate-400">Não configurado</p>
                          </div>
                        </div>
                        <Badge variant="default">Disponível</Badge>
                        <button className="btn btn-outline btn-sm mt-3 w-full">
                          Configurar
                        </button>
                      </div>

                      <div className="card p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <ContactsIcon className="w-6 h-6 text-slate-400" />
                          <div>
                            <h4 className="font-medium">Google Sheets</h4>
                            <p className="text-sm text-slate-400">Não configurado</p>
                          </div>
                        </div>
                        <Badge variant="default">Disponível</Badge>
                        <button className="btn btn-outline btn-sm mt-3 w-full">
                          Configurar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Cobrança e Planos</h3>
                  
                  <div className="card p-4 bg-emerald-500/10 border border-emerald-400/20">
                    <div className="flex items-center gap-3">
                      <CampaignsIcon className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h4 className="font-medium text-emerald-400">Plano Atual: Business Trial</h4>
                        <p className="text-sm text-emerald-400/80">Expira em 14 dias</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Informações de Cobrança</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Nome no Cartão
                        </label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Nome como está no cartão"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          CPF/CNPJ
                        </label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Endereço de Cobrança
                        </label>
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Endereço completo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="btn btn-outline">
                      Alterar Plano
                    </button>
                    <button className="btn btn-secondary">
                      Histórico de Pagamentos
                    </button>
                    <button className="btn btn-primary">
                      Atualizar Informações
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
