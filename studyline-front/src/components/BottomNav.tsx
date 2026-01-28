import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

interface BottomNavItem {
  key: string
  icon: React.ReactNode
  path: string
  title?: string
  roles?: string[]
}

interface BottomNavProps {
  items: BottomNavItem[]
  visibleOn?: string[] // маршруты, где бар должен отображаться
}

export default function BottomNav({ items, visibleOn }: BottomNavProps) {
  const nav = useNavigate()
  const loc = useLocation()
  const role = Cookies.get('role') || ''

  const active = (p: string) => loc.pathname.startsWith(p)

  // проверяем, нужно ли показывать бар на текущем маршруте
  const isVisible =
    !visibleOn || visibleOn.some((path) => loc.pathname.startsWith(path))

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 18,
        zIndex: 1200,
      }}
    >
      <div className="bottom-island">
        {items
          .filter((it) => !it.roles || it.roles.includes(role))
          .map((it) => (
            <button
              key={it.key}
              onClick={() => nav(it.path)}
              className={`island-btn ${active(it.path) ? 'active' : ''}`}
              title={it.title}
            >
              <div className="icon">{it.icon}</div>
            </button>
          ))}
      </div>
    </div>
  )
}

