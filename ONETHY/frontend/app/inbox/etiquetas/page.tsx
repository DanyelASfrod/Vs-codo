'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'

interface Tag {
  id: number
  name: string
  color: string
  conversationsCount: number
  description?: string
  createdAt: string
}

const tagColors = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTag, setNewTag] = useState({ name: '', color: tagColors[0], description: '' })

  useEffect(() => {
    // Simular dados das etiquetas
    setTimeout(() => {
      setTags([
        {
          id: 1,
          name: 'Urgente',
          color: '#EF4444',
          conversationsCount: 23,
          description: 'Conversas que precisam de atenção imediata',
          createdAt: '2025-01-15'
        },
        {
          id: 2,
          name: 'Suporte Técnico',
          color: '#3B82F6',
          conversationsCount: 89,
          description: 'Questões técnicas e problemas',
          createdAt: '2025-01-12'
        },
        {
          id: 3,
          name: 'Vendas',
          color: '#10B981',
          conversationsCount: 156,
          description: 'Conversas relacionadas a vendas',
          createdAt: '2025-01-10'
        },
        {
          id: 4,
          name: 'Dúvidas',
          color: '#F59E0B',
          conversationsCount: 67,
          description: 'Dúvidas gerais dos clientes',
          createdAt: '2025-01-08'
        },
        {
          id: 5,
          name: 'Feedback',
          color: '#8B5CF6',
          conversationsCount: 34,
          description: 'Feedbacks e sugestões',
          createdAt: '2025-01-05'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleAddTag = () => {
    if (!newTag.name.trim()) return
    
    const tag: Tag = {
      id: Date.now(),
      name: newTag.name,
      color: newTag.color,
      description: newTag.description,
      conversationsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setTags(prev => [tag, ...prev])
    setNewTag({ name: '', color: tagColors[0], description: '' })
    setShowAddTag(false)
  }

  const handleDeleteTag = (id: number) => {
    setTags(prev => prev.filter(tag => tag.id !== id))
  }

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
            <h1 className="text-2xl font-bold">Etiquetas</h1>
            <p className="text-text-muted">Organize conversas com etiquetas personalizadas</p>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowAddTag(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Etiqueta
          </button>
        </div>

        {showAddTag && (
          <div className="bg-bg-card rounded-xl p-6 border border-slate-700">
            <h3 className="font-semibold mb-4">Criar Nova Etiqueta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Etiqueta</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ex: Urgente, Suporte..."
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cor</label>
                <div className="flex gap-2">
                  {tagColors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTag.color === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTag(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição (Opcional)</label>
                <textarea
                  className="input w-full h-20 resize-none"
                  placeholder="Descreva quando usar esta etiqueta..."
                  value={newTag.description}
                  onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={handleAddTag}>
                  Criar Etiqueta
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddTag(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {tags.map(tag => (
            <div key={tag.id} className="bg-bg-card rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{tag.name}</h3>
                    {tag.description && (
                      <p className="text-text-muted text-sm mt-1">{tag.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                      <span>Criado em {new Date(tag.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{tag.conversationsCount}</div>
                    <div className="text-xs text-text-muted">Conversas</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Nenhuma etiqueta criada</h3>
            <p className="text-text-muted mb-4">Crie etiquetas para organizar suas conversas</p>
            <button className="btn btn-primary" onClick={() => setShowAddTag(true)}>
              Criar Primeira Etiqueta
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
