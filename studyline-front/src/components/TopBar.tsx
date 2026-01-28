import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
export default function TopBar() {
  const { theme } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="header" role="banner">
      <div className="logo" onClick={() => navigate('/')}>
        <img src="/logo.svg" alt="logo" style={{filter: theme === 'dark' ? 'invert(1)' : 'invert(0)'}} />
        <h3>StudyLine</h3>
      </div>
    </header>
  )
}


