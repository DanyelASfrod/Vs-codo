'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { EmptyState, Badge, StatCard } from '@/components/UI'
import { ContactsIcon } from '@/components/Icons'
import { useAuth } from '@/lib/auth'
import { getContacts, createContact, deleteContact } from '@/lib/api'

type Contact = {
  id: number
  name: string
  phone: string
  email?: string | null
  company?: string | null
  tags: string[]
  status: 'active' | 'blocked' | 'inactive'
  source: string
  totalMessages: number
  createdAt: string
}

export default function ContatosPage() {
  const { token } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all'|'active'|'inactive'|'blocked'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', company: '', tags: '' })

  const load = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getContacts(token)
      setContacts(data.contacts)
      setFilteredContacts(data.contacts)
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  useEffect(() => {
    let list = [...contacts]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(searchTerm) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
      )
    }
    if (selectedStatus !== 'all') list = list.filter(c => c.status === selectedStatus)
    setFilteredContacts(list)
  }, [contacts, searchTerm, selectedStatus])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      await createContact(token, {
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email || undefined,
        company: newContact.company || undefined,
        tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      })
      setShowAddModal(false)
      setNewContact({ name: '', phone: '', email: '', company: '', tags: '' })
      await load()
    } catch (e: any) {
      setError(e.message || 'Falha ao criar contato')
    }
  }

  const onDelete = async (id: number) => {
    if (!token) return
    if (!confirm('Remover contato?')) return
    try {
      await deleteContact(token, id)
      await load()
    } catch (e: any) {
      setError(e.message || 'Falha ao remover contato')
    }
  }

  const totalContacts = contacts.length
  const activeContacts = contacts.filter(c => c.status === 'active').length

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Contatos</h1>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Adicionar</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total" value={totalContacts} icon={<ContactsIcon />} />
            <StatCard title="Ativos" value={activeContacts} />
            <StatCard title="Inativos/Bloqueados" value={totalContacts - activeContacts} />
          </div>

          <div className="card p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Buscar..." className="input flex-1" />
              <select value={selectedStatus} onChange={(e)=>setSelectedStatus(e.target.value as any)} className="input">
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : filteredContacts.length === 0 ? (
            <EmptyState icon={<ContactsIcon />} title="Sem contatos" description="Cadastre seus primeiros contatos para iniciar conversas." action={{ label: 'Adicionar contato', onClick: ()=>setShowAddModal(true) }} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-text-muted">
                    <th className="p-3">Nome</th>
                    <th className="p-3">Contato</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Msgs</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredContacts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/30">
                      <td className="p-3">
                        <div className="font-medium">{c.name}</div>
                        {c.company && <div className="text-xs text-text-muted">{c.company}</div>}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{c.phone}</div>
                        {c.email && <div className="text-xs text-text-muted">{c.email}</div>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {c.tags.map((t,i)=>(<Badge key={i}>{t}</Badge>))}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <Badge variant={c.status==='active'?'success':c.status==='blocked'?'error':'default'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{c.totalMessages}</td>
                      <td className="p-3">
                        <button className="btn btn-danger btn-sm" onClick={()=>onDelete(c.id)}>Remover</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
              <div className="card w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Novo contato</h2>
                  <button onClick={()=>setShowAddModal(false)} className="text-text-muted">✕</button>
                </div>
                <form onSubmit={onCreate} className="space-y-3">
                  <input className="input w-full" placeholder="Nome" required value={newContact.name} onChange={(e)=>setNewContact({...newContact, name: e.target.value})} />
                  <input className="input w-full" placeholder="Telefone" required value={newContact.phone} onChange={(e)=>setNewContact({...newContact, phone: e.target.value})} />
                  <input className="input w-full" placeholder="Email (opcional)" value={newContact.email} onChange={(e)=>setNewContact({...newContact, email: e.target.value})} />
                  <input className="input w-full" placeholder="Empresa (opcional)" value={newContact.company} onChange={(e)=>setNewContact({...newContact, company: e.target.value})} />
                  <input className="input w-full" placeholder="Tags (separadas por vírgula)" value={newContact.tags} onChange={(e)=>setNewContact({...newContact, tags: e.target.value})} />
                  <div className="flex gap-3 pt-2">
                    <button type="button" className="btn btn-secondary flex-1" onClick={()=>setShowAddModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary flex-1">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
