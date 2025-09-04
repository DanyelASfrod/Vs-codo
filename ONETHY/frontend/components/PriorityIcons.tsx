import React from 'react'

// Ícones de prioridade personalizados
export const PriorityIcons = {
  None: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#64748b" stroke="#475569" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" fill="#94a3b8" opacity="0.5"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">N</text>
    </svg>
  ),
  
  Urgent: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="urgentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#dc2626"/>
        </linearGradient>
        <filter id="urgentShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#urgentGradient)" filter="url(#urgentShadow)"/>
      <path d="M12 6l2 6h-4l2-6z" fill="white" opacity="0.9"/>
      <circle cx="12" cy="16" r="1.5" fill="white"/>
      <text x="12" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">U</text>
    </svg>
  ),

  High: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="highGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#ea580c"/>
        </linearGradient>
        <filter id="highGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#highGradient)" filter="url(#highGlow)"/>
      <polygon points="12,7 15,12 12,17 9,12" fill="white" opacity="0.9"/>
      <text x="12" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">A</text>
    </svg>
  ),

  Medium: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mediumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eab308"/>
          <stop offset="100%" stopColor="#ca8a04"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#mediumGradient)"/>
      <rect x="8" y="10" width="8" height="4" rx="2" fill="white" opacity="0.9"/>
      <text x="12" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">M</text>
    </svg>
  ),

  Low: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#lowGradient)"/>
      <path d="M12 17l-2-6h4l-2 6z" fill="white" opacity="0.9"/>
      <text x="12" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">B</text>
    </svg>
  )
}

// Ícones de ação
export const ActionIcons = {
  Check: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <filter id="checkGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M20 6L9 17l-5-5" filter="url(#checkGlow)"/>
    </svg>
  ),

  Close: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <filter id="closeGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M18 6L6 18M6 6l12 12" filter="url(#closeGlow)"/>
    </svg>
  ),

  ChevronDown: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="chevronGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
        </linearGradient>
      </defs>
      <path d="M6 9l6 6 6-6" stroke="url(#chevronGradient)"/>
    </svg>
  ),

  Plus: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <filter id="plusGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M12 6v12M6 12h12" filter="url(#plusGlow)"/>
    </svg>
  ),

  Search: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6"/>
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="8" stroke="url(#searchGradient)"/>
      <path d="m21 21-4.35-4.35" stroke="url(#searchGradient)"/>
    </svg>
  ),

  User: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
        </linearGradient>
      </defs>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="url(#userGradient)"/>
      <circle cx="12" cy="7" r="4" stroke="url(#userGradient)"/>
    </svg>
  ),

  Team: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="teamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
        </linearGradient>
      </defs>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="url(#teamGradient)"/>
      <circle cx="9" cy="7" r="4" stroke="url(#teamGradient)"/>
      <path d="m22 21-3-3" stroke="url(#teamGradient)"/>
      <path d="M16 12h6M19 9v6" stroke="url(#teamGradient)"/>
    </svg>
  ),

  Tag: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="tagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
        </linearGradient>
        <filter id="tagGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="url(#tagGradient)" filter="url(#tagGlow)"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  )
}

// Ícones de status
export const StatusIcons = {
  Online: ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <defs>
        <filter id="onlineGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="6" cy="6" r="4" fill="#22c55e" filter="url(#onlineGlow)"/>
      <circle cx="6" cy="6" r="2" fill="#16a34a"/>
    </svg>
  ),

  Offline: ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4" fill="#64748b"/>
      <circle cx="6" cy="6" r="2" fill="#475569"/>
    </svg>
  ),

  Away: ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <defs>
        <filter id="awayGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="6" cy="6" r="4" fill="#f59e0b" filter="url(#awayGlow)"/>
      <circle cx="6" cy="6" r="2" fill="#d97706"/>
    </svg>
  ),

  Busy: ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <defs>
        <filter id="busyGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="6" cy="6" r="4" fill="#ef4444" filter="url(#busyGlow)"/>
      <rect x="4" y="5" width="4" height="2" rx="1" fill="white"/>
    </svg>
  )
}

// Ícones de navegação
export const NavigationIcons = {
  Menu: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="currentColor"/>
        </linearGradient>
      </defs>
      <line x1="3" y1="6" x2="21" y2="6" stroke="url(#menuGradient)"/>
      <line x1="3" y1="12" x2="21" y2="12" stroke="url(#menuGradient)"/>
      <line x1="3" y1="18" x2="21" y2="18" stroke="url(#menuGradient)"/>
    </svg>
  ),

  ChevronRight: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="chevronRightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="currentColor"/>
        </linearGradient>
      </defs>
      <path d="M9 18l6-6-6-6" stroke="url(#chevronRightGradient)"/>
    </svg>
  ),

  Settings: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <defs>
        <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
        </linearGradient>
        <filter id="settingsGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="url(#settingsGradient)" filter="url(#settingsGlow)"/>
      <circle cx="12" cy="12" r="3" stroke="url(#settingsGradient)"/>
    </svg>
  )
}
