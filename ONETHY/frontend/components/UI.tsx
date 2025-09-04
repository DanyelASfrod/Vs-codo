import { useState, useEffect } from 'react'
// Componentes de UI profissionais com animações
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  action?: { label: string, onClick: () => void }
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-600">
        {icon}
      </div>
  <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
  <div className="text-text-muted mb-6 max-w-sm mx-auto">{description}</div>
      {action && (
        <button 
          className="btn btn-primary hover:scale-105 transition-transform duration-200"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon 
}: { 
  title: string, 
  value: React.ReactNode, 
  change?: { value: string, positive: boolean }, 
  icon?: React.ReactNode 
}) {
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-text-muted text-sm">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          {change && (
            <div className={`text-xs mt-1 ${change.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {change.positive ? '+' : ''}{change.value}
            </div>
          )}
        </div>
        <div className="text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function Badge({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode, 
  variant?: 'default' | 'success' | 'warning' | 'error' 
}) {
  const variants = {
    default: 'bg-slate-800 text-text-muted border-slate-700',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max = 100, className }: { value: number, max?: number, className?: string }) {
  const percentage = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full bg-slate-800 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-500 ease-out ${className ?? 'bg-primary'}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export function AnimatedCounter({ value, duration = 2000 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])
  
  return <span>{count.toLocaleString()}</span>
}

export function Button({ 
  children, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  ...props 
}: { 
  children: React.ReactNode,
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  size?: 'xs' | 'sm' | 'small' | 'medium' | 'large',
  disabled?: boolean,
  onClick?: () => void,
  className?: string,
  [key: string]: any
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-white focus:ring-primary/50',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
    outline: 'border-2 border-slate-600 text-slate-300 hover:bg-slate-800 focus:ring-slate-500',
    ghost: 'text-slate-300 hover:bg-slate-800 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }
  
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
