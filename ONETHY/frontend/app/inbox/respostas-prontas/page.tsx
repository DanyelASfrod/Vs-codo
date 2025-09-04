'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'

interface QuickReply {
  id: number
  title: string
  content: string
  category: string
  tags: string[]
  isActive: boolean
  useCount: number
  createdAt: string
  lastUsed?: string
}

const categories = ['Geral', 'Vendas', 'Suporte', 'Cobrança', 'Técnico', 'Outros']

export default function QuickRepliesPage() {
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddReply, setShowAddReply] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [newReply, setNewReply] = useState({
    title: '',
    content: '',
    category: 'Geral',
    tags: [] as string[],
    tagInput: ''
  })

  useEffect(() => {
    // Simular dados das respostas prontas
    setTimeout(() => {
      setReplies([
        {
          id: 1,
          title: 'Confirmação de Pedido',
          content: 'Seu pedido foi confirmado com sucesso! 🎉\n\nNúmero do pedido: #{order_number}\nPrevisão de entrega: {delivery_date}\n\nVocê receberá atualizações sobre o status da entrega por WhatsApp.',
          category: 'Vendas',
          tags: ['pedido', 'confirmação', 'entrega'],
          isActive: true,
          useCount: 145,
          createdAt: '2025-01-15',
          lastUsed: '2025-01-20'
        },
        {
          id: 2,
          title: 'Problemas Técnicos',
          content: 'Entendo que você está enfrentando dificuldades técnicas. Vou te ajudar a resolver isso!\n\nPara que eu possa te auxiliar melhor, você poderia me informar:\n1️⃣ Qual dispositivo está usando?\n2️⃣ Qual navegador?\n3️⃣ Quando começou o problema?',
          category: 'Suporte',
          tags: ['técnico', 'problema', 'ajuda'],
          isActive: true,
          useCount: 87,
          createdAt: '2025-01-12',
          lastUsed: '2025-01-19'
        },
        {
          id: 3,
          title: 'Política de Cancelamento',
          content: 'Nossa política de cancelamento:\n\n✅ Até 24h antes: Cancelamento gratuito\n⚠️ Entre 24h e 2h: Taxa de 50%\n❌ Menos de 2h: Não reembolsável\n\nGostaria de prosseguir com o cancelamento?',
          category: 'Geral',
          tags: ['cancelamento', 'política', 'reembolso'],
          isActive: true,
          useCount: 72,
          createdAt: '2025-01-10',
          lastUsed: '2025-01-18'
        },
        {
          id: 4,
          title: 'Cobrança Pendente',
          content: 'Identificamos uma pendência na sua conta:\n\n💰 Valor: R$ {amount}\n📅 Vencimento: {due_date}\n\nPara regularizar, você pode:\n1️⃣ Pagar via PIX\n2️⃣ Gerar nova fatura\n3️⃣ Parcelar o valor\n\nQual opção prefere?',
          category: 'Cobrança',
          tags: ['cobrança', 'pagamento', 'pendência'],
          isActive: true,
          useCount: 96,
          createdAt: '2025-01-08',
          lastUsed: '2025-01-17'
        },
        {
          id: 5,
          title: 'Tutorial de Uso',
          content: 'Vou te ensinar a usar nossa plataforma! 📖\n\nPasso a passo:\n1️⃣ Faça login na plataforma\n2️⃣ Vá em "Meu Painel"\n3️⃣ Clique em "Novo Projeto"\n4️⃣ Preencha as informações\n5️⃣ Confirme e pronto!\n\n🎥 Quer assistir um vídeo tutorial?',
          category: 'Técnico',
          tags: ['tutorial', 'como usar', 'guia'],
          isActive: true,
          useCount: 134,
          createdAt: '2025-01-05',
          lastUsed: '2025-01-16'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleAddReply = () => {
    if (!newReply.title.trim() || !newReply.content.trim()) return
    
    const reply: QuickReply = {
      id: Date.now(),
      title: newReply.title,
      content: newReply.content,
      category: newReply.category,
      tags: newReply.tags,
      isActive: true,
      useCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setReplies(prev => [reply, ...prev])
    setNewReply({ title: '', content: '', category: 'Geral', tags: [], tagInput: '' })
    setShowAddReply(false)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newReply.tagInput.trim()) {
      const tag = newReply.tagInput.trim().toLowerCase()
      if (!newReply.tags.includes(tag)) {
        setNewReply(prev => ({
          ...prev,
          tags: [...prev.tags, tag],
          tagInput: ''
        }))
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setNewReply(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleToggleActive = (id: number) => {
    setReplies(prev => prev.map(reply => 
      reply.id === id ? { ...reply, isActive: !reply.isActive } : reply
    ))
  }

  const handleDeleteReply = (id: number) => {
    setReplies(prev => prev.filter(reply => reply.id !== id))
  }

  const filteredReplies = replies.filter(reply => {
    const matchesCategory = selectedCategory === 'Todos' || reply.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Respostas Prontas</h1>
            <p className="text-text-muted">Gerencie templates de respostas para diferentes situações</p>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowAddReply(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Resposta
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['Todos', ...categories].map(category => (
              <button
                key={category}
                className={`btn btn-sm whitespace-nowrap ${
                  selectedCategory === category 
                    ? 'btn-primary' 
                    : 'btn-ghost'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <input
              type="text"
              className="input w-full pl-10"
              placeholder="Buscar respostas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {showAddReply && (
          <div className="bg-bg-card rounded-xl p-6 border border-slate-700">
            <h3 className="font-semibold mb-4">Criar Nova Resposta Pronta</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título da Resposta</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ex: Confirmação de Pedido"
                    value={newReply.title}
                    onChange={(e) => setNewReply(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select
                    className="input w-full"
                    value={newReply.category}
                    onChange={(e) => setNewReply(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo da Resposta</label>
                <textarea
                  className="input w-full h-32 resize-none"
                  placeholder="Digite o conteúdo da resposta..."
                  value={newReply.content}
                  onChange={(e) => setNewReply(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Digite uma tag e pressione Enter"
                  value={newReply.tagInput}
                  onChange={(e) => setNewReply(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyDown={handleAddTag}
                />
                {newReply.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newReply.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-slate-700 text-slate-300 px-2 py-1 rounded-md text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-400 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={handleAddReply}>
                  Criar Resposta
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddReply(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredReplies.map(reply => (
            <div key={reply.id} className="bg-bg-card rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{reply.title}</h3>
                    <span className="text-xs text-text-muted bg-slate-800 px-2 py-1 rounded">
                      {reply.category}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${reply.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-3 mb-3">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{reply.content}</pre>
                  </div>
                  
                  {reply.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {reply.tags.map(tag => (
                        <span key={tag} className="bg-slate-700 text-slate-400 px-2 py-1 rounded-md text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>Usado {reply.useCount} vezes</span>
                    <span>•</span>
                    <span>Criado em {new Date(reply.createdAt).toLocaleDateString('pt-BR')}</span>
                    {reply.lastUsed && (
                      <>
                        <span>•</span>
                        <span>Último uso: {new Date(reply.lastUsed).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    className={`btn btn-sm ${reply.isActive ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(reply.id)}
                  >
                    {reply.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteReply(reply.id)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReplies.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">
              {searchTerm 
                ? `Nenhuma resposta encontrada para "${searchTerm}"`
                : selectedCategory === 'Todos' 
                  ? 'Nenhuma resposta pronta criada'
                  : `Nenhuma resposta na categoria "${selectedCategory}"`
              }
            </h3>
            <p className="text-text-muted mb-4">
              {searchTerm
                ? 'Tente usar outros termos de busca'
                : 'Crie respostas prontas para agilizar seu atendimento'
              }
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddReply(true)}>
              Criar Primeira Resposta
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
