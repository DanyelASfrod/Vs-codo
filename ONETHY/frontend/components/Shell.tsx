import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import {
  DashboardIcon, InboxIcon, ContactsIcon, CampaignsIcon, 
  ChatbotIcon, ReportsIcon, BillingIcon, 
  SettingsIcon, HelpIcon, WhatsappIcon
} from '@/components/Icons'

const nav = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { 
    href: '/inbox', 
    label: 'Inbox', 
    icon: InboxIcon,
    submenu: [
      { href: '/inbox', label: 'Conversas' },
      { href: '/inbox/canais', label: 'Conexões WhatsApp' },
      { href: '/inbox/agentes', label: 'Agentes' },
      { href: '/inbox/equipes', label: 'Equipes' },
      { href: '/inbox/etiquetas', label: 'Etiquetas' },
      { href: '/inbox/macros', label: 'Macros' },
      { href: '/inbox/respostas-prontas', label: 'Respostas Prontas' }
    ]
  },
  { href: '/contatos', label: 'Contatos', icon: ContactsIcon },
  { href: '/campanhas', label: 'Campanhas', icon: CampaignsIcon },
  { href: '/chatbot', label: 'Chatbot & Automação', icon: ChatbotIcon },
  { href: '/relatorios', label: 'Relatórios', icon: ReportsIcon },
  { href: '/pagamentos', label: 'Pagamentos', icon: BillingIcon },
  { href: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
  { href: '/ajuda', label: 'Ajuda', icon: HelpIcon }
]

export default function Shell({ children }: { children: ReactNode }) {
  const { setToken } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  
  function handleLogout() {
    setToken(null)
    router.push('/login')
  }

  function toggleSubmenu(href: string) {
    setExpandedMenus(prev => 
      prev.includes(href) 
        ? prev.filter(h => h !== href)
        : [...prev, href]
    )
  }
  
  return (
    <div className="min-h-screen flex bg-bg text-text">
      <aside className="w-64 hidden md:flex flex-col border-r border-slate-800 p-4 gap-2">
        <div className="flex items-center gap-3 mb-6 p-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <WhatsappIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">ONETHY</div>
            <div className="text-xs text-text-muted">WhatsApp SaaS</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(n => {
            const Icon = n.icon
            const isActive = pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href))
            const isExpanded = expandedMenus.includes(n.href)
            const hasSubmenu = n.submenu && n.submenu.length > 0
            
            return (
              <div key={n.href}>
                <div
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-text-muted hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={() => hasSubmenu ? toggleSubmenu(n.href) : router.push(n.href)}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'group-hover:text-white'}`} />
                  <span className="font-medium">{n.label}</span>
                  {hasSubmenu && (
                    <svg 
                      className={`ml-auto w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {isActive && !hasSubmenu && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                {hasSubmenu && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {n.submenu!.map(subItem => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            isSubActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                              : 'text-text-muted hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
      <section className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                className="input w-80 pl-10 bg-slate-900/50 border-slate-700 focus:border-emerald-500" 
                placeholder="Buscar conversas, contatos..." 
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V2a9 9 0 11-9 9h5z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            </button>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
              <div className="text-sm">
                <div className="text-white">Admin</div>
                <div className="text-xs text-text-muted">Online</div>
              </div>
            </div>
            <button 
              className="btn btn-ghost text-text-muted hover:text-white ml-2" 
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-bg to-slate-900/20">
          {children}
        </main>
      </section>
    </div>
  )
}
