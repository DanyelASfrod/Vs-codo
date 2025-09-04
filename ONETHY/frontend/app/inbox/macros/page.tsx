'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'

interface Macro {
  id: number
  name: string
  content: string
  shortcut?: string
  category?: string
  isActive: boolean
  useCount: number
  createdAt: string
}

const categories = ['Saudação', 'Despedida', 'Informações', 'Suporte', 'Vendas', 'Outros']

export default function MacrosPage() {
  const [macros, setMacros] = useState<Macro[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMacro, setShowAddMacro] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [newMacro, setNewMacro] = useState({
    name: '',
    content: '',
    shortcut: '',
    category: 'Outros'
  })

  useEffect(() => {
    // Simular dados das macros
    setTimeout(() => {
      setMacros([
        {
          id: 1,
          name: 'Saudação Inicial',
          content: 'Olá! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?',
          shortcut: '/oi',
          category: 'Saudação',
          isActive: true,
          useCount: 234,
          createdAt: '2025-01-15'
        },
        {
          id: 2,
          name: 'Horário de Funcionamento',
          content: 'Nosso horário de funcionamento é:\n📞 Segunda a Sexta: 8h às 18h\n📞 Sábado: 8h às 12h\n📞 Domingo: Fechado',
          shortcut: '/horario',
          category: 'Informações',
          isActive: true,
          useCount: 187,
          createdAt: '2025-01-12'
        },
        {
          id: 3,
          name: 'Aguardar Resposta',
          content: 'Entendi sua solicitação! Vou verificar essas informações e retorno em breve. Aguarde um momento, por favor.',
          shortcut: '/aguarde',
          category: 'Suporte',
          isActive: true,
          useCount: 156,
          createdAt: '2025-01-10'
        },
        {
          id: 4,
          name: 'Despedida',
          content: 'Foi um prazer atendê-lo(a)! Se precisar de mais alguma coisa, estou sempre aqui. Tenha um ótimo dia! 😊',
          shortcut: '/tchau',
          category: 'Despedida',
          isActive: true,
          useCount: 203,
          createdAt: '2025-01-08'
        },
        {
          id: 5,
          name: 'Informações de Contato',
          content: '📧 Email: contato@empresa.com\n📱 WhatsApp: (11) 99999-9999\n🌐 Site: www.empresa.com\n📍 Endereço: Rua Example, 123 - São Paulo/SP',
          shortcut: '/contato',
          category: 'Informações',
          isActive: true,
          useCount: 89,
          createdAt: '2025-01-05'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleAddMacro = () => {
    if (!newMacro.name.trim() || !newMacro.content.trim()) return
    
    const macro: Macro = {
      id: Date.now(),
      name: newMacro.name,
      content: newMacro.content,
      shortcut: newMacro.shortcut || undefined,
      category: newMacro.category,
      isActive: true,
      useCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setMacros(prev => [macro, ...prev])
    setNewMacro({ name: '', content: '', shortcut: '', category: 'Outros' })
    setShowAddMacro(false)
  }

  const handleToggleActive = (id: number) => {
    setMacros(prev => prev.map(macro => 
      macro.id === id ? { ...macro, isActive: !macro.isActive } : macro
    ))
  }

  const handleDeleteMacro = (id: number) => {
    setMacros(prev => prev.filter(macro => macro.id !== id))
  }

  const filteredMacros = selectedCategory === 'Todos' 
    ? macros 
    : macros.filter(macro => macro.category === selectedCategory)

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
            <h1 className="text-2xl font-bold">Macros</h1>
            <p className="text-text-muted">Crie respostas rápidas com atalhos para agilizar o atendimento</p>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowAddMacro(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Macro
          </button>
        </div>

        {/* Filtros */}
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

        {showAddMacro && (
          <div className="bg-bg-card rounded-xl p-6 border border-slate-700">
            <h3 className="font-semibold mb-4">Criar Nova Macro</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Macro</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ex: Saudação Inicial"
                    value={newMacro.name}
                    onChange={(e) => setNewMacro(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Atalho (Opcional)</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Ex: /oi"
                    value={newMacro.shortcut}
                    onChange={(e) => setNewMacro(prev => ({ ...prev, shortcut: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  className="input w-full"
                  value={newMacro.category}
                  onChange={(e) => setNewMacro(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo da Macro</label>
                <textarea
                  className="input w-full h-32 resize-none"
                  placeholder="Digite o conteúdo da macro..."
                  value={newMacro.content}
                  onChange={(e) => setNewMacro(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={handleAddMacro}>
                  Criar Macro
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddMacro(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredMacros.map(macro => (
            <div key={macro.id} className="bg-bg-card rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{macro.name}</h3>
                    {macro.shortcut && (
                      <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded-md text-xs font-mono">
                        {macro.shortcut}
                      </span>
                    )}
                    <span className="text-xs text-text-muted bg-slate-800 px-2 py-1 rounded">
                      {macro.category}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${macro.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 mb-3">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{macro.content}</pre>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>Usado {macro.useCount} vezes</span>
                    <span>•</span>
                    <span>Criado em {new Date(macro.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    className={`btn btn-sm ${macro.isActive ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => handleToggleActive(macro.id)}
                  >
                    {macro.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteMacro(macro.id)}
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

        {filteredMacros.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">
              {selectedCategory === 'Todos' ? 'Nenhuma macro criada' : `Nenhuma macro na categoria "${selectedCategory}"`}
            </h3>
            <p className="text-text-muted mb-4">
              {selectedCategory === 'Todos' 
                ? 'Crie macros para agilizar suas respostas'
                : 'Crie macros nesta categoria ou selecione outra'
              }
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddMacro(true)}>
              Criar Primeira Macro
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
