"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, register } from '@/lib/api'
import { toast } from '@/components/Toast'
import { WhatsappIcon, ContactsIcon, CampaignsIcon } from '@/components/Icons'
import { useAuth } from '@/lib/auth'

export default function RegistroPage() {
  const router = useRouter()
  const { setToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    company: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const reg = await register({ name: form.name, email: form.email, password: form.password, company: form.company })
      // Backend retorna token direto no registro; caso não, faz login
      if (reg?.token) {
        localStorage.setItem('token', reg.token)
        if (reg.refreshToken) localStorage.setItem('refreshToken', reg.refreshToken)
        setToken(reg.token)
        toast.success(`🎉 Conta criada com sucesso! Bem-vindo ao ONETHY, ${form.name}!`)
        router.push('/')
      } else {
        const response = await login(form.email, form.password)
        if (response?.token) {
          localStorage.setItem('token', response.token)
          if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken)
          setToken(response.token)
          toast.success(`🎉 Conta criada com sucesso! Bem-vindo ao ONETHY, ${form.name}!`)
          router.push('/')
        } else {
          throw new Error('Falha no login automático')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
      toast.error('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-bounce"></div>
      </div>

      {/* Left Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 relative z-10">
        <div className="max-w-lg">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
              <WhatsappIcon className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                ONETHY
              </h1>
              <p className="text-emerald-400 font-medium">WhatsApp Business Revolution</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
            Junte-se a mais de{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              10.000 empresas
            </span>{" "}
            que revolucionaram seu WhatsApp
          </h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4 animate-slide-right" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <ContactsIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Atendimento 24/7</h3>
                <p className="text-slate-300">Nunca perca um cliente. Responda automaticamente e converta leads em vendas.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 animate-slide-right" style={{animationDelay: '0.4s'}}>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CampaignsIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Campanhas Inteligentes</h3>
                <p className="text-slate-300">Segmente sua audiência e dispare campanhas personalizadas que convertem.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 animate-slide-right" style={{animationDelay: '0.6s'}}>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="text-2xl">📈</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Resultados Comprovados</h3>
                <p className="text-slate-300">Aumente suas vendas em até 300% com nossa plataforma inteligente.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 rounded-2xl border border-emerald-500/20 animate-glow">
            <p className="text-emerald-300 font-medium text-center">
              🚀 Comece hoje e veja a diferença em 24 horas
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-800/50 animate-slide-up">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-float">
                <WhatsappIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Crie sua conta GRÁTIS
              </h2>
              <p className="text-slate-400">
                Revolucione seu WhatsApp em menos de 2 minutos
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all text-white placeholder-slate-400"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Empresa</label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all text-white placeholder-slate-400"
                    placeholder="Nome da sua empresa"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">E-mail Profissional</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all text-white placeholder-slate-400"
                    placeholder="seu@empresa.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Senha Segura</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all text-white placeholder-slate-400 pr-12"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm animate-shake">
                  {error}
                </div>
              )}

              <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 rounded-xl p-4 border border-emerald-500/20">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  🎁 Oferta de Lançamento
                </h4>
                <ul className="text-sm text-emerald-200 space-y-1">
                  <li>✅ 14 dias GRÁTIS - sem cartão</li>
                  <li>✅ 1000 mensagens incluídas</li>
                  <li>✅ Suporte especializado</li>
                  <li>✅ Cancele quando quiser</li>
                </ul>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:transform-none animate-glow"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Criando conta...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    🚀 Começar GRÁTIS Agora
                  </span>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Ao criar sua conta, você concorda com nossos{" "}
                <a href="#" className="text-emerald-400 hover:underline">Termos</a> e{" "}
                <a href="#" className="text-emerald-400 hover:underline">Política de Privacidade</a>
              </p>

              <div className="text-center pt-4 border-t border-slate-700/50">
                <p className="text-slate-400 text-sm">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Social Proof */}
          <div className="mt-6 text-center animate-fade-in-delay">
            <div className="flex items-center justify-center space-x-4 text-slate-400 text-sm">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-slate-900"></div>
                  <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-slate-900"></div>
                </div>
                <span className="ml-2">10k+ empresas confiam</span>
              </div>
              <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
              <span>⭐ 4.9/5 avaliação</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
