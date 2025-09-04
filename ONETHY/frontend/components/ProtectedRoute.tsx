import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!token) router.replace('/login')
  }, [token, router])
  if (!token) return null
  return <>{children}</>
}
