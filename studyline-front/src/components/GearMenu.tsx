import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import Cookies from 'js-cookie'
import ThemeToggle from './ThemeToggle'

export default function GearMenu() {
  const [open, setOpen] = useState(false)
  const hasToken = !!Cookies.get('access_token')

  function logout() {
    Cookies.remove('access_token')
    Cookies.remove('role')
    Cookies.remove('id')
    location.href = '/'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 100,
      }}
    >
      {/* Кнопка шестерёнки */}
      <button
        onClick={() => setOpen(!open)}
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          fontSize: 15,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'all .2s',
        }}
      >
        <Settings size={25} />
      </button>

      {/* Выпадающее меню */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 0,
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 3px 8px rgba(0,0,0,.3)',
            animation: 'fadeIn .25s ease',
            minWidth: 200,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
            }}
          >
            <span style={{ fontSize: 14 }}>Тема</span>
            <ThemeToggle sise={10}/>
          </div>
          
          {hasToken && (
             <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                color: 'inherit',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background .2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--border)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              Выйти
            </button>
          )}
        </div>
      )}
    </div>
  )
}

