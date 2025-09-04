'use client'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { EmptyState, Badge, StatCard } from '@/components/UI'
import { InboxIcon, ContactsIcon, WhatsappIcon, CampaignsIcon, ReportsIcon, LoadingIcon } from '@/components/Icons'
import { useState, useEffect } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'general' | 'billing' | 'technical' | 'integrations'
  tags: string[]
}

interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  lastUpdate: string
}

export default function AjudaPage(){
  const [activeSection, setActiveSection] = useState<'faq' | 'contact' | 'tickets' | 'docs'>('faq')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAjudaData() {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const [faqsRes, ticketsRes] = await Promise.all([
          fetch('/api/faqs', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/tickets', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const faqsData = await faqsRes.json();
        const ticketsData = await ticketsRes.json();
        setFaqs(faqsData.faqs || []);
        setTickets(ticketsData.tickets || []);
        setLoading(false);
      } catch {
        setFaqs([]);
        setTickets([]);
        setLoading(false);
      }
    }
    fetchAjudaData();
  }, []);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success'
      case 'pending': return 'default'
      case 'open': return 'error'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'default'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                Centro de Ajuda
              </h1>
              <p className="text-text-muted mt-1">
                Encontre respostas e obtenha suporte
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Artigos de Ajuda"
              value={faqs.length}
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Tickets Abertos"
              value={tickets.filter(t => t.status !== 'resolved').length}
              icon={<ContactsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Tempo de Resposta"
              value="< 2h"
              icon={<WhatsappIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Taxa de Resolução"
              value="98%"
              icon={<CampaignsIcon className="w-6 h-6" />}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="card">
            <div className="border-b border-slate-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'faq', label: 'Perguntas Frequentes', icon: <InboxIcon className="w-4 h-4" /> },
                  { id: 'docs', label: 'Documentação', icon: <ReportsIcon className="w-4 h-4" /> },
                  { id: 'tickets', label: 'Meus Tickets', icon: <ContactsIcon className="w-4 h-4" /> },
                  { id: 'contact', label: 'Contato', icon: <WhatsappIcon className="w-4 h-4" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeSection === tab.id
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
              {/* FAQ Section */}
              {activeSection === 'faq' && (
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar perguntas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
                      />
                      <InboxIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input w-48"
                    >
                      <option value="all">Todas as categorias</option>
                      <option value="general">Geral</option>
                      <option value="technical">Técnico</option>
                      <option value="billing">Cobrança</option>
                      <option value="integrations">Integrações</option>
                    </select>
                  </div>

                  {/* FAQ List */}
                  {loading ? (
                    <div className="text-center py-8">
                      <LoadingIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
                      <p className="text-slate-400">Carregando perguntas...</p>
                    </div>
                  ) : filteredFaqs.length === 0 ? (
                    <EmptyState
                      icon={<InboxIcon className="w-12 h-12" />}
                      title="Nenhuma pergunta encontrada"
                      description={searchTerm ? 
                        `Nenhuma pergunta corresponde à busca "${searchTerm}"` :
                        "Tente ajustar os filtros"
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredFaqs.map(faq => (
                        <details key={faq.id} className="group border border-slate-700 rounded-lg">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30">
                            <h3 className="font-medium text-white group-open:text-emerald-400">
                              {faq.question}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{faq.category}</Badge>
                              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          <div className="px-4 pb-4">
                            <p className="text-slate-300 mb-3">{faq.answer}</p>
                            <div className="flex flex-wrap gap-2">
                              {faq.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Documentation Section */}
              {activeSection === 'docs' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="card p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <WhatsappIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Guia de Início</h3>
                          <p className="text-sm text-slate-400">Primeiros passos</p>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4">
                        Aprenda a configurar sua conta e conectar o WhatsApp em poucos minutos.
                      </p>
                      <button className="btn btn-outline w-full">Ler Guia</button>
                    </div>

                    <div className="card p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <CampaignsIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">API Reference</h3>
                          <p className="text-sm text-slate-400">Documentação técnica</p>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4">
                        Documentação completa da API para desenvolvedores.
                      </p>
                      <button className="btn btn-outline w-full">Ver API</button>
                    </div>

                    <div className="card p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <ReportsIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Webhooks</h3>
                          <p className="text-sm text-slate-400">Integrações</p>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4">
                        Como configurar e usar webhooks para integrar com sistemas externos.
                      </p>
                      <button className="btn btn-outline w-full">Ver Webhooks</button>
                    </div>

                    <div className="card p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <ContactsIcon className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Chatbot</h3>
                          <p className="text-sm text-slate-400">Automação</p>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4">
                        Crie fluxos automatizados e configure respostas inteligentes.
                      </p>
                      <button className="btn btn-outline w-full">Ver Tutorial</button>
                    </div>

                    <div className="card p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <InboxIcon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Troubleshooting</h3>
                          <p className="text-sm text-slate-400">Solução de problemas</p>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4">
                        Resolva problemas comuns e encontre soluções rápidas.
                      </p>
                      <button className="btn btn-outline w-full">Ver Soluções</button>
                    </div>

                    <div className="card p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <CampaignsIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Melhores Práticas</h3>
                          <p className="text-sm text-slate-400">Dicas e truques</p>
                        </div>
                      </div>
                      <p className="text-slate-300 mb-4">
                        Aprenda as melhores práticas para maximizar seus resultados.
                      </p>
                      <button className="btn btn-outline w-full">Ver Dicas</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Tickets Section */}
              {activeSection === 'tickets' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Meus Tickets de Suporte</h3>
                    <button className="btn btn-primary">
                      <ContactsIcon className="w-4 h-4 mr-2" />
                      Novo Ticket
                    </button>
                  </div>

                  {tickets.length === 0 ? (
                    <EmptyState
                      icon={<ContactsIcon className="w-12 h-12" />}
                      title="Nenhum ticket encontrado"
                      description="Você não possui tickets de suporte abertos"
                      action={{
                        label: 'Criar Ticket',
                        onClick: () => {}
                      }}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800 border-b border-slate-700">
                          <tr>
                            <th className="text-left p-4 font-medium text-slate-300">ID</th>
                            <th className="text-left p-4 font-medium text-slate-300">Assunto</th>
                            <th className="text-left p-4 font-medium text-slate-300">Status</th>
                            <th className="text-left p-4 font-medium text-slate-300">Prioridade</th>
                            <th className="text-left p-4 font-medium text-slate-300">Criado</th>
                            <th className="text-left p-4 font-medium text-slate-300">Atualizado</th>
                            <th className="text-left p-4 font-medium text-slate-300">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {tickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-4 text-slate-300">#{ticket.id}</td>
                              <td className="p-4 text-white font-medium">{ticket.subject}</td>
                              <td className="p-4">
                                <Badge variant={getStatusColor(ticket.status)}>
                                  {ticket.status === 'open' ? 'Aberto' :
                                   ticket.status === 'pending' ? 'Pendente' : 'Resolvido'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge variant={getPriorityColor(ticket.priority)}>
                                  {ticket.priority === 'high' ? 'Alta' :
                                   ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                                </Badge>
                              </td>
                              <td className="p-4 text-slate-300">{ticket.createdAt}</td>
                              <td className="p-4 text-slate-300">{ticket.lastUpdate}</td>
                              <td className="p-4">
                                <button className="text-emerald-400 hover:text-emerald-300 text-sm">
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Section */}
              {activeSection === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Entre em Contato</h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Assunto
                          </label>
                          <input
                            type="text"
                            className="input w-full"
                            placeholder="Descreva brevemente sua dúvida"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Categoria
                          </label>
                          <select className="input w-full">
                            <option value="">Selecione uma categoria</option>
                            <option value="technical">Suporte Técnico</option>
                            <option value="billing">Cobrança</option>
                            <option value="feature">Solicitação de Recurso</option>
                            <option value="bug">Relatar Bug</option>
                            <option value="other">Outro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Prioridade
                          </label>
                          <select className="input w-full">
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descrição
                          </label>
                          <textarea
                            rows={6}
                            className="input w-full"
                            placeholder="Descreva detalhadamente sua dúvida ou problema..."
                          />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">
                          Enviar Mensagem
                        </button>
                      </form>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Outras Formas de Contato</h3>
                      <div className="space-y-4">
                        <div className="card p-4 border border-slate-700">
                          <div className="flex items-center gap-3">
                            <WhatsappIcon className="w-6 h-6 text-emerald-400" />
                            <div>
                              <h4 className="font-medium">WhatsApp</h4>
                              <p className="text-sm text-slate-400">+55 11 99999-9999</p>
                              <p className="text-xs text-slate-500">Seg-Sex: 9h às 18h</p>
                            </div>
                          </div>
                        </div>

                        <div className="card p-4 border border-slate-700">
                          <div className="flex items-center gap-3">
                            <InboxIcon className="w-6 h-6 text-blue-400" />
                            <div>
                              <h4 className="font-medium">Email</h4>
                              <p className="text-sm text-slate-400">suporte@onethy.com</p>
                              <p className="text-xs text-slate-500">Resposta em até 24h</p>
                            </div>
                          </div>
                        </div>

                        <div className="card p-4 border border-slate-700">
                          <div className="flex items-center gap-3">
                            <CampaignsIcon className="w-6 h-6 text-purple-400" />
                            <div>
                              <h4 className="font-medium">Chat ao Vivo</h4>
                              <p className="text-sm text-slate-400">Disponível no site</p>
                              <p className="text-xs text-slate-500">Seg-Sex: 9h às 18h</p>
                            </div>
                          </div>
                        </div>

                        <div className="card p-4 border border-emerald-400/20 bg-emerald-500/5">
                          <div className="flex items-center gap-3">
                            <ReportsIcon className="w-6 h-6 text-emerald-400" />
                            <div>
                              <h4 className="font-medium text-emerald-400">Base de Conhecimento</h4>
                              <p className="text-sm text-emerald-400/80">Respostas instantâneas</p>
                              <p className="text-xs text-emerald-400/60">Disponível 24/7</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
