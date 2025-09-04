'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'

interface Team {
  id: number
  name: string
  description?: string
  color?: string
  membersCount: number
  conversationsCount: number
  members: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTeam, setShowAddTeam] = useState(false)

  useEffect(() => {
    // Simular dados das equipes
    setTimeout(() => {
      setTeams([
        {
          id: 1,
          name: 'Suporte Técnico',
          description: 'Equipe responsável pelo suporte técnico aos clientes',
          color: '#10B981',
          membersCount: 5,
          conversationsCount: 127,
          members: [
            { id: 1, name: 'João Silva', email: 'joao@empresa.com', role: 'admin' },
            { id: 2, name: 'Maria Santos', email: 'maria@empresa.com', role: 'agent' }
          ]
        },
        {
          id: 2,
          name: 'Vendas',
          description: 'Equipe de vendas e relacionamento com clientes',
          color: '#3B82F6',
          membersCount: 8,
          conversationsCount: 89,
          members: [
            { id: 3, name: 'Pedro Costa', email: 'pedro@empresa.com', role: 'agent' },
            { id: 4, name: 'Ana Lima', email: 'ana@empresa.com', role: 'agent' }
          ]
        },
        {
          id: 3,
          name: 'Financeiro',
          description: 'Equipe financeira para questões de pagamento',
          color: '#F59E0B',
          membersCount: 3,
          conversationsCount: 34,
          members: [
            { id: 5, name: 'Carlos Silva', email: 'carlos@empresa.com', role: 'agent' }
          ]
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

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
            <h1 className="text-2xl font-bold">Equipes</h1>
            <p className="text-text-muted">Gerencie equipes e distribua conversas</p>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowAddTeam(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Equipe
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {teams.map(team => (
            <div key={team.id} className="bg-bg-card rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <p className="text-text-muted text-sm">{team.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="btn btn-ghost btn-sm text-red-400 hover:text-red-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-4 text-center">
                <div>
                  <div className="text-xl font-bold text-emerald-400">{team.membersCount}</div>
                  <div className="text-xs text-text-muted">Membros</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-400">{team.conversationsCount}</div>
                  <div className="text-xs text-text-muted">Conversas</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">Membros da Equipe</div>
                {team.members.slice(0, 3).map(member => (
                  <div key={member.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs text-white">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span>{member.name}</span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted capitalize">{member.role}</span>
                  </div>
                ))}
                {team.members.length > 3 && (
                  <div className="text-sm text-text-muted">
                    +{team.members.length - 3} outros membros
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <button className="btn btn-ghost btn-sm w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Membro
                </button>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20a3 3 0 01-3-3v-2a3 3 0 013-3h1a3 3 0 013 3v2a3 3 0 01-3 3zm8-10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Nenhuma equipe criada</h3>
            <p className="text-text-muted mb-4">Crie equipes para organizar seus agentes</p>
            <button className="btn btn-primary" onClick={() => setShowAddTeam(true)}>
              Criar Primeira Equipe
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
