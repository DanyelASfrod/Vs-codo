'use client'

import { useState, useEffect, useRef } from 'react'
import Shell from '../../components/Shell'
import ProtectedRoute from '../../components/ProtectedRoute'
import { Badge, EmptyState } from '../../components/UI'
import { conversationsAPI, messagesAPI, teamsAPI, macrosAPI } from '../../lib/api'

interface Contact {
  id: number
  name: string
  phone: string
  email?: string
  avatar?: string
}

interface User {
  id: number
  name: string
  email: string
  status: string
}

interface Team {
  id: number
  name: string
  color?: string
}

interface Message {
  id: number
  content: string
  type: string
  createdAt: string
  fromMe: boolean
  user: User
}

interface Conversation {
  id: number
  status: string
  priority: string
  lastMessage: string
  lastActivity: string
  unreadCount: number
  contact: Contact
  assignedAgent?: User
  assignedTeam?: Team
  messages?: Message[]
  _count?: {
    messages: number
  }
}

interface Macro {
  id: number
  name: string
  content: string
  shortcut?: string
}

export default function InboxComplete() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [macros, setMacros] = useState<Macro[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isPrivateMessage, setIsPrivateMessage] = useState(false)
  const [selectedInbox, setSelectedInbox] = useState('Todas as Conversas')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMacros, setShowMacros] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Carregar conversas quando filtros mudarem
  useEffect(() => {
    loadConversations()
  }, [filterStatus, filterPriority, searchTerm])

  // Carregar mensagens quando conversa for selecionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [conversationsData, teamsData, macrosData] = await Promise.all([
        conversationsAPI.list(),
        teamsAPI.list(),
        macrosAPI.list()
      ])
      
      setConversations(conversationsData.conversations || conversationsData)
      setTeams(teamsData)
      setMacros(macrosData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterPriority) params.priority = filterPriority
      if (searchTerm) params.search = searchTerm

      const data = await conversationsAPI.list(params)
      setConversations(data.conversations || data)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await messagesAPI.list(conversationId)
      setMessages(data.messages || [])
      
      // Marcar como lida
      await messagesAPI.markAsRead(conversationId)
      
      // Atualizar contador não lidas na conversa local
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sendingMessage) return

    try {
      setSendingMessage(true)
      
      const message = await messagesAPI.send(
        selectedConversation.id, 
        newMessage, 
        'text',
        { isPrivate: isPrivateMessage }
      )

      // Adicionar mensagem à lista local
      setMessages(prev => [...prev, message])
      
      // Limpar campo de mensagem
      setNewMessage('')
      
      // Atualizar última mensagem da conversa
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { 
              ...conv, 
              lastMessage: newMessage.substring(0, 100),
              lastActivity: new Date().toISOString()
            }
          : conv
      ))

      // Reset para mensagem pública
      setIsPrivateMessage(false)
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleUseMacro = async (macro: Macro) => {
    try {
      await macrosAPI.use(macro.id)
      setNewMessage(prev => prev + macro.content)
      setShowMacros(false)
      
      // Focar no textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (error) {
      console.error('Erro ao usar macro:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return // Permite quebra de linha com Shift+Enter
    }
    
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: string) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(date)
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return messageDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'closed': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'normal': return 'text-blue-500'
      case 'low': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Shell>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando conversas...</p>
            </div>
          </div>
        </Shell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Shell>
        <div className="flex h-full bg-white dark:bg-gray-900">
          {/* Lista de Conversas */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Header da Inbox */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inbox</h1>
                
                {/* Selector de Inbox */}
                <div className="relative">
                  <select 
                    value={selectedInbox} 
                    onChange={(e) => setSelectedInbox(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option>Todas as Conversas</option>
                    <option>Atribuídas a Mim</option>
                    <option>Não Atribuídas</option>
                    <option>Aguardando</option>
                    <option>Fechadas</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex gap-2 mb-4">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Status</option>
                  <option value="open">Aberta</option>
                  <option value="pending">Pendente</option>
                  <option value="closed">Fechada</option>
                </select>
                <select 
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="flex-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Prioridade</option>
                  <option value="urgent">Urgente</option>
                  <option value="high">Alta</option>
                  <option value="normal">Normal</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              {/* Barra de Pesquisa */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="Nenhuma conversa encontrada"
                  description="Não há conversas que correspondam aos seus filtros."
                />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-emerald-50 dark:bg-emerald-900/20 border-r-2 border-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {conversation.contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conversation.contact.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`}></div>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(conversation.lastActivity)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                                {conversation.priority}
                              </span>
                              {conversation.assignedAgent && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {conversation.assignedAgent.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Área de Conversa */}
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="💬"
                title="Selecione uma conversa"
                description="Escolha uma conversa da lista para começar a responder."
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Header da Conversa */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedConversation.contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedConversation.contact.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedConversation.contact.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Status Selector */}
                    <select 
                      value={selectedConversation.status}
                      onChange={(e) => {
                        // Implementar mudança de status
                      }}
                      className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="open">Aberta</option>
                      <option value="pending">Pendente</option>
                      <option value="closed">Fechada</option>
                    </select>
                    
                    {/* Action Buttons */}
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.fromMe
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.fromMe ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compositor de Mensagens */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {/* Toggle Reply/Private */}
                <div className="flex items-center mb-3">
                  <div className="relative bg-gray-100 dark:bg-gray-700 rounded-full p-1 flex">
                    <button
                      onClick={() => setIsPrivateMessage(false)}
                      className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                        !isPrivateMessage 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                      }`}
                    >
                      Responder
                    </button>
                    <button
                      onClick={() => setIsPrivateMessage(true)}
                      className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                        isPrivateMessage 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                      }`}
                    >
                      Nota Privada
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isPrivateMessage ? "Adicionar nota privada..." : "Digite sua mensagem..."}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    disabled={sendingMessage}
                  />
                  
                  {/* Toolbar */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      {/* Emoji */}
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      
                      {/* Attachment */}
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      
                      {/* Microphone */}
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>

                      {/* Macros */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowMacros(!showMacros)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </button>
                        
                        {showMacros && (
                          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                            <div className="p-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Macros</p>
                              <div className="max-h-40 overflow-y-auto">
                                {macros.map((macro) => (
                                  <button
                                    key={macro.id}
                                    onClick={() => handleUseMacro(macro)}
                                    className="w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  >
                                    <div className="font-medium">{macro.name}</div>
                                    {macro.shortcut && (
                                      <div className="text-xs text-gray-500">{macro.shortcut}</div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* AI */}
                      <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Shift + Enter para nova linha
                      </span>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        {sendingMessage ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
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
