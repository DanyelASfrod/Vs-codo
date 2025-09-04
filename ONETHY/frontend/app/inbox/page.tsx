'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button, Badge, EmptyState } from '@/components/UI'
import { useAuth } from '@/lib/auth'
import { useInboxAPI } from '@/lib/inbox-api'
import { InboxIcon, WhatsappIcon } from '@/components/Icons'
import { PriorityIcons, ActionIcons, StatusIcons, NavigationIcons } from '@/components/PriorityIcons'

type ApiConversation = {
  id: number;
  channelId: number; // Adicionar campo do canal
  contact: {
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  status: 'open' | 'pending' | 'resolved';
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
  assignedAgent?: string;
  priority: 'low' | 'medium' | 'high';
  channel: 'whatsapp';
  labels: string[];
};
type Message = {
  id: number;
  content: string;
  timestamp: Date;
  fromMe: boolean;
  type: 'text' | 'image' | 'audio' | 'document';
};

type ConversationNote = {
  id: number;
  content: string;
  isPrivate: boolean;
  author: string;
  createdAt: string;
};

export default function InboxPage() {
  // Estados para seleção funcional
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null) // Novo estado para canal
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [selectedMacro, setSelectedMacro] = useState<number | null>(null)
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([])

  // Handler para atribuir agente
  const handleAssignAgent = async () => {
    if (!selectedConversation || !selectedAgent) return
    try {
      await import('@/lib/api').then(mod => mod.conversationsAPI.assign(selectedConversation, Number(selectedAgent)))
      setConversations(prev => prev.map(c => c.id === selectedConversation ? { ...c, assignedAgent: selectedAgent } : c))
    } catch (e) {
      console.error('Falha ao atribuir agente', e)
    }
  }

  // Handler para atribuir equipe
  const handleAssignTeam = async () => {
    if (!selectedConversation || !selectedTeam) return
    try {
      await import('@/lib/api').then(mod => mod.conversationsAPI.assign(selectedConversation, Number(selectedAgent), selectedTeam))
      setConversations(prev => prev.map(c => c.id === selectedConversation ? { ...c, teamId: selectedTeam } : c))
    } catch (e) {
      console.error('Falha ao atribuir equipe', e)
    }
  }

  // Handler para aplicar macro
  const handleApplyMacro = async () => {
    if (!selectedConversation || !selectedMacro) return
    try {
      await import('@/lib/api').then(mod => mod.macrosAPI.use(selectedMacro))
      // Opcional: atualizar mensagens localmente
    } catch (e) {
      console.error('Falha ao aplicar macro', e)
    }
  }

  // Handler para adicionar etiquetas
  const handleAddEtiquetas = async () => {
    if (!selectedConversation || selectedEtiquetas.length === 0) return
    try {
      await inbox.conversations.update(selectedConversation, { tags: selectedEtiquetas })
      setConversations(prev => prev.map(c => c.id === selectedConversation ? { ...c, labels: selectedEtiquetas } : c))
    } catch (e) {
      console.error('Falha ao adicionar etiquetas', e)
    }
  }
  const { token } = useAuth()
  const inbox = useInboxAPI()
  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [channels, setChannels] = useState<any[]>([]) // Novo estado para canais
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'unassigned' | 'open' | 'pending' | 'resolved'>('all')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [conversationNotes, setConversationNotes] = useState<ConversationNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isPrivateNote, setIsPrivateNote] = useState(true)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)

  // Estados para controlar expansão dos menus
  const [expandedSections, setExpandedSections] = useState({
    actions: true,
    macros: true,
    conversationInfo: false,
    contactAttributes: false,
    previousConversations: false,
    participants: false
  })

  // Dados reais de macros e equipes
  const [macros, setMacros] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  useEffect(() => {
    let cancelled = false
    async function loadMacrosTeamsChannels() {
      try {
        // Carregar macros
        const macrosRes = await import('@/lib/api').then(mod => mod.macrosAPI.list())
        if (!cancelled) setMacros(macrosRes.macros || macrosRes)
        // Carregar equipes
        const teamsRes = await import('@/lib/api').then(mod => mod.teamsAPI.list())
        if (!cancelled) setTeams(teamsRes.teams || teamsRes)
        // Carregar canais
        const channelsRes = await import('@/lib/channels-api').then(mod => mod.channelsService.getChannels())
        if (!cancelled) setChannels(channelsRes)
      } catch (e) {
        console.error('Falha ao carregar macros/equipes/canais', e)
      }
    }
    loadMacrosTeamsChannels()
    return () => { cancelled = true }
  }, [])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const convRes = await inbox.conversations.list({ page: 1, limit: 50 })
        // Backend retorna { conversations, pagination }
        const convs = convRes.conversations as any[]
        if (!cancelled) setConversations(convs as ApiConversation[])
      } catch (e) {
        console.error('Falha ao carregar conversas', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadMessages() {
      if (!selectedConversation) return
      try {
  const res = await inbox.messages.list(selectedConversation, { page: 1, limit: 50 })
        // Backend retorna { messages, pagination }
        const msgs = (res.messages || []).map((m: any) => ({
          id: m.id,
          content: m.content,
          timestamp: new Date(m.timestamp),
          fromMe: m.fromMe,
          type: (m.type || 'text') as Message['type']
        })) as Message[]
        if (!cancelled) setMessages(msgs)
      } catch (e) {
        console.error('Falha ao carregar mensagens', e)
        if (!cancelled) setMessages([])
      }
    }
    loadMessages()
    return () => { cancelled = true }
  }, [selectedConversation])

  // Filtrar conversas baseado na pesquisa e filtros
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'open' && conv.status === 'open') ||
      (activeFilter === 'pending' && conv.status === 'pending') ||
      (activeFilter === 'resolved' && conv.status === 'resolved') ||
      (activeFilter === 'mine' && conv.assignedAgent) ||
      (activeFilter === 'unassigned' && !conv.assignedAgent)

    // Filtrar por canal selecionado
    const matchesChannel = selectedChannel === null || conv.channelId === selectedChannel

    return matchesSearch && matchesFilter && matchesChannel
  })

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return
    try {
      const res = await inbox.messages.send(selectedConversation, { content: message })
      // Acrescenta otimisticamente
      setMessages(prev => [...prev, { id: res.id, content: res.content, timestamp: new Date(res.timestamp || Date.now()), fromMe: true, type: (res.type || 'text') } as Message])
      setMessage('')
    } catch (e) {
      console.error('Falha ao enviar mensagem', e)
    }
  }

  const addNote = () => {
    if (!newNote.trim()) return
    
    const note: ConversationNote = {
      id: Date.now(),
      content: newNote.trim(),
      isPrivate: isPrivateNote,
      author: "Você",
      createdAt: new Date().toISOString()
    }
    
    setConversationNotes(prev => [...prev, note])
    setNewNote('')
  }

  const filterOptions = [
    { key: 'all', label: 'Todas', count: conversations.length },
    { key: 'mine', label: 'Minhas', count: conversations.filter(c => c.assignedAgent).length },
    { key: 'unassigned', label: 'Não atribuídas', count: conversations.filter(c => !c.assignedAgent).length },
    { key: 'open', label: 'Abertas', count: conversations.filter(c => c.status === 'open').length },
    { key: 'pending', label: 'Pendentes', count: conversations.filter(c => c.status === 'pending').length },
    { key: 'resolved', label: 'Resolvidas', count: conversations.filter(c => c.status === 'resolved').length },
  ];
  
  return (
    <ProtectedRoute>
      <Shell>
        <CustomStyles />
        <div className="flex h-screen bg-bg">
          {/* Lista de Conversas */}
          <div className="w-96 bg-gradient-to-b from-bg-card/95 to-bg-card border-r border-slate-700/50 backdrop-blur-sm flex flex-col shadow-2xl">
            {/* Header com animação */}
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-900/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#30B286] to-[#1E293B] rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                      <InboxIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      Inbox
                    </h2>
                    <p className="text-sm text-slate-400">Gerencie suas conversas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">Online</span>
                </div>
              </div>
              
              {/* Barra de Pesquisa Premium */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#30B286]/20 to-[#1E293B]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-[#30B286]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Pesquisar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#30B286]/50 focus:border-[#30B286]/50 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/70 focus:bg-slate-800/80"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-6 h-6 bg-slate-700 rounded-md flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-medium">⌘K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros Modernos */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filterOptions.map((filter, index) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key as any)}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 transform hover:scale-105 ${
                      activeFilter === filter.key
                        ? 'bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white shadow-lg ring-2 ring-[#30B286]/20'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/60 hover:text-white border border-slate-600/30 backdrop-blur-sm'
                    } animation-delay-${index * 100}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{filter.label}</span>
                      <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${
                        activeFilter === filter.key 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-600 text-slate-300'
                      }`}>
                        {filter.count}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Seletor de Canais */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedChannel(null)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    selectedChannel === null
                      ? 'bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white shadow-lg'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/60 border border-slate-600/30'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <InboxIcon className="w-4 h-4" />
                    <span>Todas as Caixas</span>
                  </span>
                </button>
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                      selectedChannel === channel.id
                        ? 'bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white shadow-lg'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/60 border border-slate-600/30'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <WhatsappIcon className="w-4 h-4" />
                      <span>{channel.name}</span>
                      <span className={`inline-flex items-center justify-center w-4 h-4 text-xs rounded-full ${
                        channel.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}></span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Conversas com animações */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-slate-800/30 animate-pulse">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full shadow-inner"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg w-3/4"></div>
                          <div className="h-3 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg w-1/2"></div>
                        </div>
                        <div className="w-2 h-2 bg-[#30B286]/50 rounded-full animate-ping"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="relative mx-auto mb-6 w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl transform rotate-6 shadow-2xl"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center shadow-xl border border-slate-600/50">
                      <InboxIcon className="w-10 h-10 text-slate-400" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-[#30B286] to-[#1E293B] rounded-full animate-bounce opacity-75"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-3">
                    Nenhuma conversa encontrada
                  </h3>
                  <p className="text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                    Não há conversas que correspondam aos seus filtros atuais. Que tal começar uma nova conversa?
                  </p>
                  <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white font-medium rounded-xl hover:opacity-95 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nova Conversa
                  </button>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conversation, index) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedConversation === conversation.id 
                          ? 'bg-gradient-to-r from-[#30B286]/20 to-[#1E293B]/20 shadow-lg border border-[#30B286]/30' 
                          : 'hover:bg-slate-800/40 border border-transparent hover:border-slate-700/50'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Indicador de seleção */}
                      {selectedConversation === conversation.id && (
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-[#30B286] to-[#1E293B] rounded-r-full"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Avatar com status */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#30B286] to-[#1E293B] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                            {conversation.contact.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          {/* Status online */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-bg-card shadow-lg"></div>
                          {/* Indicador de não lidas */}
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse shadow-lg">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-white truncate group-hover:text-blue-100 transition-colors duration-200">
                              {conversation.contact.name || conversation.contact.phone}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {conversation.priority === 'high' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                              )}
                              <span className="text-xs text-slate-400">{conversation.lastActivity}</span>
                            </div>
                          </div>
                          
                          {/* Última mensagem */}
                          <p className="text-slate-400 text-sm truncate mb-2 group-hover:text-slate-300 transition-colors duration-200">
                            {conversation.lastMessage}
                          </p>
                          
                          {/* Footer com badges */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {/* Canal */}
                              <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                <WhatsappIcon className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </div>
                              
                              {/* Status */}
                              <div className={`w-2 h-2 rounded-full ${
                                conversation.status === 'open' ? 'bg-emerald-400' :
                                conversation.status === 'pending' ? 'bg-yellow-400' :
                                'bg-slate-400'
                              }`}></div>
                            </div>
                            
                            {/* Etiquetas */}
                            {conversation.labels.length > 0 && (
                              <div className="flex space-x-1">
                                {conversation.labels.slice(0, 2).map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-[#30B286]/20 text-[#30B286] text-xs rounded-full border border-[#30B286]/30"
                                  >
                                    {label}
                                  </span>
                                ))}
                                {conversation.labels.length > 2 && (
                                  <span className="text-slate-500 text-xs">+{conversation.labels.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Efeito hover */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#30B286]/5 to-[#1E293B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Área de Chat Premium */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm">
            {selectedConversation ? (
              <>
                {/* Header da Conversa Premium */}
                <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-md border-b border-slate-700/50 p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar com animação */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#30B286] to-[#1E293B] rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xl transform transition-transform duration-300 hover:scale-105">
                          {conversations.find(c => c.id === selectedConversation)?.contact.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-slate-900 animate-pulse shadow-lg"></div>
                      </div>
                      
                      {/* Info do contato */}
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                          {conversations.find(c => c.id === selectedConversation)?.contact.name || 
                           conversations.find(c => c.id === selectedConversation)?.contact.phone}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <p className="text-slate-400">
                            {conversations.find(c => c.id === selectedConversation)?.contact.phone}
                          </p>
                          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                          <span className="text-sm text-emerald-400 flex items-center">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ações do header com hover effects */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-700/50">
                        <WhatsappIcon className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-slate-300">WhatsApp</span>
                      </div>
                      
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all duration-300 transform hover:scale-110 border border-transparent hover:border-slate-600/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setShowContactInfo(!showContactInfo)}
                        className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 border ${
                          showContactInfo 
                            ? 'text-[#30B286] bg-[#30B286]/20 border-[#30B286]/30' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent hover:border-slate-600/50'
                        }`}
                      >
                        <NavigationIcons.Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mensagens Premium */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent via-slate-900/10 to-slate-800/20">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center max-w-md">
                        <div className="relative mx-auto mb-8 w-24 h-24">
                          {/* Círculos animados de fundo */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#30B286]/20 to-[#1E293B]/20 rounded-full animate-pulse"></div>
                          <div className="absolute inset-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full shadow-2xl"></div>
                          <div className="absolute inset-4 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center shadow-inner">
                            <InboxIcon className="w-8 h-8 text-slate-400" />
                          </div>
                          
                          {/* Pontos flutuantes */}
                          <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce opacity-75"></div>
                          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-bounce opacity-75" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                        
                        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-3">
                          Nenhuma mensagem
                        </h3>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                          Inicie uma conversa enviando uma mensagem.
                        </p>
                        
                        <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white font-medium rounded-xl hover:opacity-95 transition-all duration-300 transform hover:scale-105 shadow-lg">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.458L3 21l2.458-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                          </svg>
                          Começar conversa
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`flex items-end space-x-3 animate-slide-up ${
                          msg.fromMe ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Avatar da mensagem */}
                        {!msg.fromMe && (
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg">
                            {conversations.find(c => c.id === selectedConversation)?.contact.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        
                        {/* Balão da mensagem */}
                        <div className={`relative max-w-xs lg:max-w-md xl:max-w-lg group ${
                          msg.fromMe ? 'ml-auto' : ''
                        }`}>
                          {/* Mensagem com gradiente e sombra */}
                          <div className={`relative p-4 rounded-2xl shadow-xl backdrop-blur-sm border transition-all duration-300 hover:shadow-2xl ${
                            msg.fromMe
                              ? 'bg-gradient-to-br from-[#30B286] to-[#1E293B] text-white border-[#30B286]/30 shadow-[rgba(48,178,134,0.2)]'
                              : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700/50 shadow-slate-800/50'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            
                            {/* Timestamp com estilo */}
                            <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
                              msg.fromMe 
                                ? 'border-[#30B286]/30' 
                                : 'border-slate-700/50'
                            }`}>
                              <span className={`text-xs ${
                                msg.fromMe 
                                  ? 'text-emerald-100' 
                                  : 'text-slate-400'
                              }`}>
                                {msg.timestamp.toLocaleTimeString()}
                              </span>
                              
                              {/* Status da mensagem */}
                              {msg.fromMe && (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <svg className="w-4 h-4 text-emerald-200 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            {/* Reações hover */}
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 bg-slate-800 rounded-full px-2 py-1 shadow-xl border border-slate-700">
                              <button className="text-xs hover:scale-125 transition-transform">👍</button>
                              <button className="text-xs hover:scale-125 transition-transform">❤️</button>
                              <button className="text-xs hover:scale-125 transition-transform">😊</button>
                            </div>
                          </div>
                          
                          {/* Cauda da mensagem */}
                          <div className={`absolute w-3 h-3 ${
                            msg.fromMe 
                              ? 'right-4 bg-gradient-to-br from-blue-600 to-blue-700' 
                              : 'left-4 bg-gradient-to-br from-slate-800 to-slate-900'
                          } transform rotate-45 -bottom-1`}></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input de Mensagem Premium */}
                <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-md border-t border-slate-700/50 p-6 shadow-lg">
                  <div className="relative">
                    {/* Background com efeito glass */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl backdrop-blur-sm border border-slate-600/30"></div>
                    
                    <div className="relative flex items-end space-x-4">
                      {/* Botões de ação */}
                      <div className="flex space-x-2">
                        <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300 transform hover:scale-110 border border-transparent hover:border-slate-600/50">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </button>
                        <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300 transform hover:scale-110 border border-transparent hover:border-slate-600/50">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000-6h-1m4 6V4a3 3 0 013 3v4M9 10v2a3 3 0 003 3h1" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Input */}
                      <div className="flex-1 relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Digite sua mensagem..."
                          className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none min-h-[48px] max-h-32 scrollbar-hide"
                          rows={1}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        
                        {/* Contador de caracteres */}
                        <div className="absolute bottom-2 right-3 text-xs text-slate-500">
                          {message.length}/1000
                        </div>
                      </div>
                      
                      {/* Botão de envio */}
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                          message.trim()
                            ? 'bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white hover:opacity-95 border border-[#30B286]/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Shortcuts info */}
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <div className="flex items-center space-x-4">
                      <span>Pressione Enter para enviar</span>
                      <span>Shift + Enter para quebra de linha</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span>Conectado</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State Premium */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="relative mx-auto mb-8 w-32 h-32">
                    {/* Círculos animados de fundo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full shadow-2xl"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center shadow-inner">
                      <InboxIcon className="w-16 h-16 text-slate-400" />
                    </div>
                    
                    {/* Pontos flutuantes */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-[#30B286] to-[#1E293B] rounded-full animate-bounce opacity-75"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-bounce opacity-75" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
                    Selecione uma conversa
                  </h2>
                  <p className="text-slate-400 mb-8 leading-relaxed">
                    Escolha uma conversa da lista para começar a visualizar as mensagens.
                  </p>
                  
                  {/* Ações rápidas */}
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#30B286] to-[#1E293B] text-white font-medium rounded-xl hover:opacity-95 transition-all duration-300 transform hover:scale-105 shadow-lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nova Conversa
                    </button>
                    
                    <button className="w-full flex items-center justify-center px-6 py-3 bg-slate-800/50 text-slate-300 font-medium rounded-xl hover:bg-slate-700/60 transition-all duration-300 transform hover:scale-105 border border-slate-700/50 hover:border-slate-600/50">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ações Rápidas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Painel Lateral - Canais, Agentes, Equipes */}
          {showContactInfo && selectedConversation && (() => {
            const selectedConversationData = conversations.find(c => c.id === selectedConversation)
            if (!selectedConversationData) return null

            const toggleSection = (section: keyof typeof expandedSections) => {
              setExpandedSections(prev => ({
                ...prev,
                [section]: !prev[section]
              }))
            }

            return (
              <div className="w-80 bg-bg-card border-l border-slate-800 flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Gerenciar Conversa</h3>
                    <button
                      onClick={() => setShowContactInfo(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ActionIcons.Close className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Informações do Contato */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {selectedConversationData.contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">
                        {selectedConversationData.contact.name || selectedConversationData.contact.phone}
                      </h4>
                      <p className="text-slate-400 text-sm">{selectedConversationData.contact.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <Badge variant={selectedConversationData.status === 'open' ? 'success' : 'warning'}>
                        {selectedConversationData.status === 'open' ? 'Aberto' : 
                         selectedConversationData.status === 'pending' ? 'Pendente' : 'Resolvido'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canal:</span>
                      <span className="text-white">WhatsApp</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Última atividade:</span>
                      <span className="text-white">{selectedConversationData.lastActivity}</span>
                    </div>
                    {selectedConversationData.assignedAgent && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Agente:</span>
                        <span className="text-white">{selectedConversationData.assignedAgent}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações de Gerenciamento */}
                <div className="flex-1 p-4 space-y-4">
                  {/* Atribuir Agente */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Agente Responsável</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedAgent || ''}
                      onChange={e => setSelectedAgent(e.target.value || null)}
                    >
                      <option value="">Selecionar agente</option>
                      {Array.from(new Set(conversations.map(c => c.assignedAgent).filter(Boolean))).map((agent, idx) => (
                        <option key={idx} value={agent!}>{agent}</option>
                      ))}
                    </select>
                    <Button 
                      variant="primary" 
                      size="small" 
                      className="w-full" 
                      onClick={handleAssignAgent} 
                      disabled={!selectedAgent || !selectedConversation}
                    >
                      Atribuir Agente
                    </Button>
                  </div>

                  {/* Atribuir Equipe */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Equipe Responsável</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedTeam || ''}
                      onChange={e => setSelectedTeam(Number(e.target.value) || null)}
                    >
                      <option value="">Selecionar equipe</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                    <Button 
                      variant="primary" 
                      size="small" 
                      className="w-full" 
                      onClick={handleAssignTeam} 
                      disabled={!selectedTeam || !selectedConversation}
                    >
                      Atribuir Equipe
                    </Button>
                  </div>

                  {/* Aplicar Macro */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Macros Disponíveis</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedMacro || ''}
                      onChange={e => setSelectedMacro(Number(e.target.value) || null)}
                    >
                      <option value="">Selecionar macro</option>
                      {macros.map(macro => (
                        <option key={macro.id} value={macro.id}>{macro.name}</option>
                      ))}
                    </select>
                    <Button 
                      variant="primary" 
                      size="small" 
                      className="w-full" 
                      onClick={handleApplyMacro} 
                      disabled={!selectedMacro || !selectedConversation}
                    >
                      Aplicar Macro
                    </Button>
                  </div>

                  {/* Gerenciar Etiquetas */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Etiquetas</label>
                    <select
                      multiple
                      className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedEtiquetas}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions).map(opt => opt.value)
                        setSelectedEtiquetas(options)
                      }}
                    >
                      {Array.from(new Set(conversations.flatMap(c => c.labels))).map((label, idx) => (
                        <option key={idx} value={label}>{label}</option>
                      ))}
                    </select>
                    <Button 
                      variant="primary" 
                      size="small" 
                      className="w-full" 
                      onClick={handleAddEtiquetas} 
                      disabled={selectedEtiquetas.length === 0 || !selectedConversation}
                    >
                      Aplicar Etiquetas
                    </Button>
                  </div>

                  {/* Alterar Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Status da Conversa</label>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedConversationData.status === 'open' ? 'primary' : 'secondary'} 
                        size="small" 
                        className="flex-1"
                        onClick={() => {
                          // Implementar mudança de status para 'open'
                          setConversations(prev => prev.map(c => 
                            c.id === selectedConversation ? { ...c, status: 'open' } : c
                          ))
                        }}
                      >
                        Abrir
                      </Button>
                      <Button 
                        variant={selectedConversationData.status === 'pending' ? 'primary' : 'secondary'} 
                        size="small" 
                        className="flex-1"
                        onClick={() => {
                          // Implementar mudança de status para 'pending'
                          setConversations(prev => prev.map(c => 
                            c.id === selectedConversation ? { ...c, status: 'pending' } : c
                          ))
                        }}
                      >
                        Pendente
                      </Button>
                      <Button 
                        variant={selectedConversationData.status === 'resolved' ? 'primary' : 'secondary'} 
                        size="small" 
                        className="flex-1"
                        onClick={() => {
                          // Implementar mudança de status para 'resolved'
                          setConversations(prev => prev.map(c => 
                            c.id === selectedConversation ? { ...c, status: 'resolved' } : c
                          ))
                        }}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notas da Conversa */}
                <div className="border-t border-slate-800 p-4">
                  <h4 className="text-white font-medium mb-3">Notas da Conversa</h4>
                  
                  <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                    {conversationNotes.length > 0 ? (
                      conversationNotes.map((note) => (
                        <div key={note.id} className="bg-slate-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">{note.author}</span>
                            <div className="flex items-center space-x-2">
                              {note.isPrivate && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                  Privada
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-white">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">
                        Nenhuma nota adicionada ainda.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="private-note"
                        checked={isPrivateNote}
                        onChange={(e) => setIsPrivateNote(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="private-note" className="text-sm text-slate-400">
                        Nota privada
                      </label>
                    </div>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Adicionar uma nota..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                    />
                    <Button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      variant="primary"
                      size="small"
                      className="w-full"
                    >
                      Adicionar Nota
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </Shell>
    </ProtectedRoute>
  );
}

// Componente de estilos customizados para adicionar ao head
const CustomStyles = () => {
  useEffect(() => {
    const customStyles = `
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
        }
        50% {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.4);
        }
      }
      
      .animate-slide-up {
        animation: slide-up 0.5s ease-out forwards;
      }
      
      .animate-fade-in {
        animation: fade-in 0.3s ease-out forwards;
      }
      
      .animate-pulse-glow {
        animation: pulse-glow 2s infinite;
      }
      
      /* Scrollbar personalizada */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(51, 65, 85, 0.3);
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, rgb(59, 130, 246), rgb(37, 99, 235));
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, rgb(37, 99, 235), rgb(29, 78, 216));
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      /* Efeitos de glass morphism */
      .glass-effect {
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(148, 163, 184, 0.1);
      }
      
      /* Animações de hover suaves */
      .hover-lift:hover {
        transform: translateY(-2px);
        transition: all 0.2s ease-out;
      }
      
      /* Gradientes animados */
      @keyframes gradient-shift {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
      
      .animate-gradient {
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
      }
      
      /* Sombras suaves */
      .shadow-soft {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                    0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      .shadow-soft-lg {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
                    0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
    `

    // Adicionar estilos ao head se não existir
    if (!document.getElementById('inbox-custom-styles')) {
      const styleSheet = document.createElement('style')
      styleSheet.id = 'inbox-custom-styles'
      styleSheet.textContent = customStyles
      document.head.appendChild(styleSheet)
    }

    // Cleanup
    return () => {
      const existingStyles = document.getElementById('inbox-custom-styles')
      if (existingStyles) {
        existingStyles.remove()
      }
    }
  }, [])

  return null
}
