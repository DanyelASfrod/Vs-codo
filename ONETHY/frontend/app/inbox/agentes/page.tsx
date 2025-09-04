'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'

interface Agent {
  id: number
  name: string
  email: string
  role: string
  status: string
  avatar?: string
  conversationsCount: number
  averageResponseTime: string
  onlineStatus: boolean
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddAgent, setShowAddAgent] = useState(false)

  useEffect(() => {
    // Simular dados dos agentes
    setTimeout(() => {
      setAgents([
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@empresa.com',
          role: 'admin',
          status: 'active',
          conversationsCount: 45,
          averageResponseTime: '2m 30s',
          onlineStatus: true
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@empresa.com',
          role: 'agent',
          status: 'active',
          conversationsCount: 32,
          averageResponseTime: '1m 45s',
          onlineStatus: false
        },
        {
          id: 3,
          name: 'Pedro Costa',
          email: 'pedro@empresa.com',
          role: 'agent',
          status: 'inactive',
          conversationsCount: 18,
          averageResponseTime: '3m 12s',
          onlineStatus: false
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      agent: 'Agente',
      user: 'Usuário'
    }
    return roles[role] || role
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-emerald-400' : 'text-slate-500'
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
            <h1 className="text-2xl font-bold">Agentes</h1>
            <p className="text-text-muted">Gerencie agentes e permissões do sistema</p>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowAddAgent(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Agente
          </button>
        </div>

        <div className="grid gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="bg-bg-card rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium">
                      {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-card ${
                      agent.onlineStatus ? 'bg-emerald-500' : 'bg-slate-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <p className="text-text-muted">{agent.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        {getRoleLabel(agent.role)}
                      </span>
                      <span className={getStatusColor(agent.status)}>
                        {agent.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{agent.conversationsCount}</div>
                    <div className="text-xs text-text-muted">Conversas</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{agent.averageResponseTime}</div>
                    <div className="text-xs text-text-muted">Tempo Resp.</div>
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
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="font-medium mb-2">Nenhum agente encontrado</h3>
            <p className="text-text-muted mb-4">Adicione agentes para gerenciar conversas</p>
            <button className="btn btn-primary" onClick={() => setShowAddAgent(true)}>
              Adicionar Primeiro Agente
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
