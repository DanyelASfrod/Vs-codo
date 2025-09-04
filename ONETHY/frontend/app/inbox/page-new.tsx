'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Badge, Button, EmptyState } from '@/components/UI'
import { useAuth } from '@/lib/auth'
import { InboxIcon } from '@/components/Icons'
import { WhatsappIcon } from '@/components/Icons'

type ApiConversation = {
  id: string
  contact: {
    name: string
    phone: string
    email?: string
    avatar?: string
  }
  status: 'open' | 'pending' | 'resolved'
  lastMessage: string
  lastActivity: string
  unreadCount: number
  assignedAgent?: string
  priority: 'low' | 'medium' | 'high'
  channel: 'whatsapp' | 'email' | 'chat' | 'instagram' | 'facebook' | 'telegram'
  labels: string[]
}

type Message = {
  id: string
  content: string
  timestamp: Date
  fromMe: boolean
  type: 'text' | 'image' | 'audio' | 'document' | 'activity'
}

type ConversationNote = {
  id: number
  content: string
  isPrivate: boolean
  author: string
  createdAt: string
}

export default function InboxPage() {
  const { token } = useAuth()
  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'unassigned' | 'open' | 'pending' | 'resolved'>('all')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [replyMode, setReplyMode] = useState<'reply' | 'private'>('reply')
  const [conversationNotes, setConversationNotes] = useState<ConversationNote[]>([
    {
      id: 1,
      content: "Cliente parece interessado em upgrade do plano. Mencionou necessidade de mais usuários.",
      isPrivate: false,
      author: "João Silva",
      createdAt: "2024-01-15T10:30:00Z"
    }
  ])
  const [newNote, setNewNote] = useState('')
  const [isPrivateNote, setIsPrivateNote] = useState(true)

  // Mock data para demonstração
  const mockConversations: ApiConversation[] = [
    {
      id: '1',
      contact: { name: 'Maria Silva', phone: '+55 11 99999-9999', email: 'maria@email.com' },
      status: 'open',
      lastMessage: 'Olá, preciso de ajuda com meu pedido',
      lastActivity: new Date().toISOString(),
      unreadCount: 3,
      assignedAgent: 'João Silva',
      priority: 'high',
      channel: 'whatsapp',
      labels: ['suporte', 'urgente']
    },
    {
      id: '2', 
      contact: { name: 'João Santos', phone: '+55 11 88888-8888' },
      status: 'pending',
      lastMessage: 'Obrigado pelo atendimento!',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      unreadCount: 0,
      priority: 'medium',
      channel: 'email',
      labels: ['vendas']
    }
  ]

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Olá, preciso de ajuda com meu pedido',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      fromMe: false,
      type: 'text'
    },
    {
      id: '2', 
      content: 'Claro! Posso te ajudar. Qual é o número do seu pedido?',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      fromMe: true,
      type: 'text'
    }
  ]

  const selectedConversationData = conversations.find(c => c.id === selectedConversation)

  useEffect(() => {
    setConversations(mockConversations)
    setMessages(mockMessages)
    setLoading(false)
  }, [])

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

    return matchesSearch && matchesFilter
  })

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date(),
      fromMe: true,
      type: 'text'
    }
    
    setMessages(prev => [...prev, newMessage])
    setMessage('')
  }

  const handleStatusChange = (conversationId: string, newStatus: string) => {
    console.log(`Changing status for conversation ${conversationId} to ${newStatus}`)
    // Aqui você implementaria a lógica para alterar o status da conversa
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
    { key: 'resolved', label: 'Resolvidas', count: conversations.filter(c => c.status === 'resolved').length }
  ]

  return (
    <ProtectedRoute>
      <Shell>
        <div className="flex h-screen bg-bg">
          {/* Lista de Conversas */}
          <div className="w-96 bg-bg-card border-r border-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-xl font-bold text-white">Inbox</h2>
                {/* Seletor de Inbox */}
                <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                  <option>WhatsApp Suporte</option>
                  <option>E-mail Vendas</option>
                  <option>Chat Online</option>
                </select>
              </div>
              
              {/* Barra de Pesquisa */}
              <div className="relative mb-4">
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Pesquisar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setActiveFilter(option.key as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      activeFilter === option.key
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-400">Carregando...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-slate-400">Nenhuma conversa encontrada</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredConversations.map((conv) => (
                    <div 
                      key={conv.id}
                      className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        selectedConversation === conv.id ? 'bg-emerald-500/10 border-r-4 border-r-emerald-500' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar com canal */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {conv.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          {conv.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                              {conv.unreadCount}
                            </div>
                          )}
                          {/* Indicador do canal */}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                            {conv.channel === 'whatsapp' && <WhatsappIcon className="w-2.5 h-2.5 text-green-500" />}
                            {conv.channel === 'email' && <svg className="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white truncate">{conv.contact.name}</h4>
                            <div className="flex items-center gap-2">
                              {/* Indicador de prioridade */}
                              {conv.priority === 'high' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              {/* SLA */}
                              <span className="text-xs text-yellow-400">2h</span>
                              <span className="text-xs text-slate-400">
                                {new Date(conv.lastActivity).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 truncate mt-1">{conv.lastMessage}</p>
                          
                          {/* Status e Labels */}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={conv.status === 'open' ? 'success' : conv.status === 'pending' ? 'warning' : 'default'}>
                              {conv.status === 'open' ? 'Aberta' : conv.status === 'pending' ? 'Pendente' : 'Resolvida'}
                            </Badge>
                            {conv.labels.slice(0, 2).map((label, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Área Principal do Chat */}
          <div className="flex-1 flex flex-col bg-bg">
            {selectedConversationData ? (
              <>
                {/* Header do Chat - Modern Design */}
                <div className="conversation-details-wrap bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700">
                  <div className="flex flex-col items-center justify-between px-4 py-2 border-b bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 md:flex-row">
                    <div className="flex flex-col items-center justify-center flex-1 w-full min-w-0 md:flex-row">
                      <div className="flex items-center justify-start max-w-full min-w-0 w-fit">
                        <div className="user-thumbnail-box rounded-full" style={{height: '40px', width: '40px'}}>
                          <div className="avatar-container user-thumbnail rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold" style={{fontSize: '16px'}}>
                            {selectedConversationData.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex flex-col items-start min-w-0 ml-2 overflow-hidden w-fit">
                          <div className="flex flex-row items-center max-w-full gap-1 p-0 m-0 w-fit">
                            <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus-visible:text-slate-900 dark:focus-visible:text-white hover:underline focus-visible:underline outline-transparent p-0 font-medium underline-offset-2 text-sm font-medium justify-center">
                              <span className="text-base font-medium truncate leading-tight text-slate-900 dark:text-white">
                                {selectedConversationData.contact.name}
                              </span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                            <button 
                              className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 text-blue-600 dark:text-blue-400 hover:underline focus-visible:underline outline-transparent p-0 font-medium underline-offset-2 text-xs justify-center"
                              onClick={() => setShowContactInfo(!showContactInfo)}
                            >
                              <span className="min-w-0 truncate">Mais detalhes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row items-center justify-end flex-grow gap-2 mt-3 lg:mt-0">
                        <div className="relative flex items-center gap-2">
                          <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:bg-slate-100 dark:focus-visible:bg-slate-700 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          </button>
                          
                          <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:bg-slate-100 dark:focus-visible:bg-slate-700 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                          </button>
                          
                          <div className="relative flex items-center justify-end">
                            <div className="rounded-lg shadow outline-1 outline border border-slate-300 dark:border-slate-600">
                              <button 
                                className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-l-lg outline-1 outline disabled:opacity-50 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:bg-slate-200 dark:focus-visible:bg-slate-600 text-slate-900 dark:text-white outline-transparent h-8 px-3 text-sm justify-center"
                                onClick={() => selectedConversation && handleStatusChange(selectedConversation, 'resolved')}
                              >
                                <span className="min-w-0 truncate">Resolver</span>
                              </button>
                              <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-r-lg outline-1 outline disabled:opacity-50 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus-visible:bg-slate-200 dark:focus-visible:bg-slate-600 text-slate-900 dark:text-white outline-transparent h-8 w-8 p-0 text-sm justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de Mensagens - Modern Style */}
                <div className="flex h-full min-h-0 m-0">
                  <div className="flex flex-col justify-between flex-grow h-full min-w-0 m-0">
                    <div className="flex justify-end">
                      <button className="!rounded-r-none !rounded-2xl !fixed z-10 top-32 inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-900/10 dark:bg-slate-100/10 text-slate-900 dark:text-slate-100 hover:bg-slate-900/20 dark:hover:bg-slate-100/20 focus-visible:bg-slate-900/20 dark:focus-visible:bg-slate-100/20 outline-transparent h-6 w-6 p-0 text-xs justify-center">
                        <svg className="w-3 h-3 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <ul className="px-4 bg-white dark:bg-slate-900 conversation-panel flex-1 overflow-y-auto">
                      <li className="min-h-[4rem]" />
                      
                      {messages.map((msg) => (
                        <div key={msg.id} id={`message${msg.id}`} className={`flex w-full message-bubble-container mb-2 ${msg.fromMe ? 'justify-end' : msg.type === 'activity' ? 'justify-center' : 'justify-start'}`}>
                          {msg.type === 'activity' ? (
                            <div>
                              <div className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg max-w-lg px-2 py-0.5 !rounded-full flex min-w-0 items-center gap-2" title={msg.content}>
                                <span>{msg.content}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1fr gap-x-3" style={{gridTemplateAreas: '"bubble" "meta"'}}>
                              <div className={`[grid-area:bubble] flex ${msg.fromMe ? 'ltr:pl-9 rtl:pl-0 justify-end' : 'ltr:pr-9 rtl:pr-0 justify-start'}`}>
                                <div className={`text-sm ${msg.fromMe 
                                  ? 'bg-blue-500 text-white right-bubble rounded-xl ltr:rounded-br-sm rtl:rounded-bl-sm' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white left-bubble rounded-xl ltr:rounded-bl-sm rtl:rounded-br-sm'
                                } max-w-lg px-4 py-3`}>
                                  <div className="gap-3 flex flex-col">
                                    <span className="prose prose-bubble">
                                      <p>{msg.content}</p>
                                    </span>
                                  </div>
                                  <div className={`text-xs flex items-center gap-1.5 ${msg.fromMe ? 'justify-end text-blue-200' : 'justify-start text-slate-500 dark:text-slate-400'} mt-2`}>
                                    <div className="inline">
                                      <time className="inline">
                                        {msg.timestamp.toLocaleDateString('pt-BR', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </time>
                                    </div>
                                    {msg.fromMe && (
                                      <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" transform="translate(2,0)" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </ul>

                    {/* Footer da Conversa - Modern Style */}
                    <div className="conversation-footer bg-white dark:bg-slate-900">
                      {/* Banner de Auto-atribuição */}
                      <div className="flex items-center justify-center h-12 gap-4 px-4 py-3 text-xs text-white bg-blue-600 dark:bg-blue-700 mx-2 mb-2 rounded-lg">
                        <span className="banner-message">
                          Esta conversa não está atribuída a você. Gostaria de atribuir esta conversa a você mesmo?
                        </span>
                        <div className="actions">
                          <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 text-white hover:bg-blue-500 dark:hover:bg-blue-600 focus-visible:bg-blue-500 dark:focus-visible:bg-blue-600 outline-transparent h-6 px-2 text-xs justify-center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="min-w-0 truncate">Atribuir a mim</span>
                          </button>
                        </div>
                      </div>

                      {/* Reply Box */}
                      <div className="reply-box">
                        <div className="flex justify-between h-[3.25rem] gap-2 px-3">
                          {/* Toggle Reply/Private */}
                          <button 
                            className="flex items-center w-auto h-8 p-1 transition-all border rounded-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 group relative duration-300 ease-in-out z-0 mt-3"
                            onClick={() => setReplyMode(replyMode === 'reply' ? 'private' : 'reply')}
                          >
                            <div className={`flex items-center gap-1 px-2 z-20 transition-colors duration-300 ${replyMode === 'reply' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              Responder
                            </div>
                            <div className={`flex items-center gap-1 px-2 z-20 transition-colors duration-300 ${replyMode === 'private' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              Mensagem Privada
                            </div>
                            <div 
                              className="absolute shadow-sm rounded-full h-6 transition-all duration-300 ease-in-out bg-slate-900 dark:bg-white"
                              style={{
                                width: replyMode === 'reply' ? '87.59375px' : '146px',
                                transform: replyMode === 'reply' ? 'translateX(0px)' : 'translateX(87.59375px)'
                              }}
                            />
                          </button>
                          
                          <div className="flex items-center mx-4 my-0" />
                          
                          <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 outline-transparent h-10 w-10 p-0 text-sm font-medium justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>

                        {/* Textarea */}
                        <div className="reply-box__top">
                          <textarea
                            placeholder="Shift + enter para nova linha. Digite '/' para selecionar uma Resposta Pronta."
                            rows={2}
                            className="rounded-none w-full p-3 bg-white dark:bg-slate-900 border-0 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none focus:outline-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            style={{ height: '64px' }}
                          />
                        </div>

                        {/* Toolbar */}
                        <div className="flex justify-between p-3">
                          <div className="left-wrap flex items-center gap-2">
                            <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:bg-slate-200/60 dark:focus-visible:bg-slate-700/60 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM8.5 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM12 17.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
                              </svg>
                            </button>

                            <label className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:bg-slate-200/60 dark:focus-visible:bg-slate-700/60 outline-transparent h-8 w-8 p-0 text-sm justify-center cursor-pointer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <input
                                type="file"
                                id="conversationAttachment"
                                className="hidden"
                                accept="image/*,audio/*,video/*,.3gpp,text/csv,text/plain,application/json,application/pdf,text/rtf,application/zip,application/x-7z-compressed,application/vnd.rar,application/x-tar,application/msword,application/vnd.ms-excel,application/vnd.ms-powerpoint,application/vnd.oasis.opendocument.text,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                multiple
                              />
                            </label>

                            <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:bg-slate-200/60 dark:focus-visible:bg-slate-700/60 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </button>

                            <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:bg-slate-200/60 dark:focus-visible:bg-slate-700/60 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                            </button>

                            <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:bg-slate-200/60 dark:focus-visible:bg-slate-700/60 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            {/* AI Button com animação de ping */}
                            <div className="relative">
                              <button className="inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-slate-100/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:bg-slate-200/60 dark:focus-visible:bg-slate-700/60 outline-transparent h-8 w-8 p-0 text-sm justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </button>
                              <div className="absolute top-0 right-0 -mt-1 -mr-1">
                                <div className="animate-ping h-2 w-2 bg-blue-400 rounded-full"></div>
                                <div className="absolute top-0 h-2 w-2 bg-blue-500 rounded-full"></div>
                              </div>
                            </div>

                            {/* Drag and Drop Overlay */}
                            <div className="fixed top-0 bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-center w-full h-full gap-2 text-slate-900 dark:text-slate-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur" style={{display: 'none'}}>
                              <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                                <path d="M6.087 7.75a5.752 5.752 0 0 1 11.326 0h.087a4 4 0 0 1 3.962 4.552 6.534 6.534 0 0 0-1.597-1.364A2.501 2.501 0 0 0 17.5 9.25h-.756a.75.75 0 0 1-.75-.713 4.25 4.25 0 0 0-8.489 0 .75.75 0 0 1-.749.713H6a2.5 2.5 0 0 0 0 5h4.4a6.458 6.458 0 0 0-.357 1.5H6a4 4 0 0 1 0-8h.087ZM22 16.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Zm-6-1.793V19.5a.5.5 0 0 0 1 0v-4.793l1.646 1.647a.5.5 0 0 0 .708-.708l-2.5-2.5a.5.5 0 0 0-.708 0l-2.5 2.5a.5.5 0 0 0 .708.708L16 14.707Z" fill="currentColor"></path>
                              </svg>
                              <h4 className="text-2xl break-words text-slate-900 dark:text-slate-50">Arraste e solte aqui para anexar</h4>
                            </div>
                          </div>

                          <div className="right-wrap">
                            <button 
                              type="submit" 
                              className="flex-shrink-0 inline-flex items-center min-w-0 gap-2 transition-all duration-200 ease-in-out border-0 rounded-lg outline-1 outline disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 focus-visible:bg-blue-700 outline-transparent h-8 px-3 text-sm justify-center"
                              onClick={handleSendMessage}
                              disabled={!message.trim()}
                            >
                              <span className="min-w-0 truncate">Enviar (⌘ + ↵)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={<InboxIcon className="w-12 h-12" />}
                  title="Selecione uma conversa"
                  description="Escolha uma conversa da lista para começar a atender seus clientes"
                />
              </div>
            )}
          </div>

          {/* Painel Lateral - Informações da Conversa */}
          {selectedConversationData && showConversationInfo && (
            <div className="w-80 bg-bg-card border-l border-slate-800 flex flex-col">
              <div className="h-16 bg-bg-card border-b border-slate-800 flex items-center justify-between px-4">
                <h3 className="font-semibold text-white">Info da Conversa</h3>
                <Button 
                  variant="ghost" 
                  size="small"
                  onClick={() => setShowConversationInfo(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* SLA Status */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    SLA Status
                  </h4>
                  <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Primeira resposta:</span>
                      <span className="text-sm text-emerald-400 font-medium">✓ Em dia</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Resolução:</span>
                      <span className="text-sm text-yellow-400 font-medium">2h restantes</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h11c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
                    </svg>
                    Etiquetas
                  </h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedConversationData.labels.map((label, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" size="small" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Adicionar Etiqueta
                    </Button>
                  </div>
                </div>

                {/* Responsável */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Responsável
                  </h4>
                  <div className="bg-slate-800 rounded-lg p-3">
                    {selectedConversationData.assignedAgent ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {selectedConversationData.assignedAgent.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{selectedConversationData.assignedAgent}</p>
                          <p className="text-xs text-slate-400">Atribuído há 2h</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Não atribuído</p>
                    )}
                    <Button variant="outline" size="small" className="w-full mt-3">
                      Alterar Responsável
                    </Button>
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    Notas Internas
                  </h4>
                  <div className="space-y-2">
                    {conversationNotes.length > 0 ? (
                      conversationNotes.map((note) => (
                        <div key={note.id} className="bg-slate-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-emerald-400">{note.author}</span>
                              {note.isPrivate && (
                                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                  Privada
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">
                        Nenhuma nota encontrada
                      </p>
                    )}
                    
                    {/* Nova Nota */}
                    <div className="space-y-2">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Adicionar nova nota..."
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isPrivateNote}
                            onChange={(e) => setIsPrivateNote(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 bg-slate-800 border-slate-600 rounded focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-300">Nota privada</span>
                        </label>
                        <Button 
                          size="small"
                          disabled={!newNote.trim()}
                          onClick={addNote}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Painel Lateral - Informações do Contato */}
          {selectedConversationData && showContactInfo && (
            <div className="w-80 bg-bg-card border-l border-slate-800 flex flex-col">
              <div className="h-16 bg-bg-card border-b border-slate-800 flex items-center justify-between px-4">
                <h3 className="font-semibold text-white">Info do Contato</h3>
                <Button 
                  variant="ghost" 
                  size="small"
                  onClick={() => setShowContactInfo(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                    {selectedConversationData.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-white">{selectedConversationData.contact.name}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400">Telefone</label>
                    <p className="text-sm text-white">{selectedConversationData.contact.phone}</p>
                  </div>
                  
                  {selectedConversationData.contact.email && (
                    <div>
                      <label className="text-xs font-medium text-slate-400">Email</label>
                      <p className="text-sm text-white">{selectedConversationData.contact.email}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-slate-400">Status</label>
                    <p className="text-sm text-emerald-400">Online</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
