"use client"
import { useState, useCallback } from 'react'

let toastFn: ((msg: string, type?: 'success'|'error') => void) | null = null
export function useToast() {
  return toastFn
}

export const toast = {
  success: (msg: string) => toastFn?.(msg, 'success'),
  error: (msg: string) => toastFn?.(msg, 'error')
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ msg: string, type: 'success'|'error' }[]>([])
  toastFn = useCallback((msg: string, type: 'success'|'error' = 'success') => {
    setToasts(t => [...t, { msg, type }].slice(-3))
    setTimeout(() => setToasts(t => t.slice(1)), 4000)
  },[])
  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t,i)=>(
          <div key={i} className={`card px-4 py-2 shadow-soft ${t.type==='error'?'bg-danger text-white':'bg-emerald-600 text-black'}`}>{t.msg}</div>
        ))}
      </div>
    </>
  )
}
