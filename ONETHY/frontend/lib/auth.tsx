"use client"
import { useEffect, useState, createContext, useContext } from 'react'

export type AuthType = { token: string|null, setToken: (t:string|null)=>void }
const AuthContext = createContext<AuthType>({ token: null, setToken: ()=>{} })

import { ReactNode, FC } from 'react'
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string|null>(null)
  useEffect(() => {
    setToken(localStorage.getItem('token'))
  },[])
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
