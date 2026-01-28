import React from 'react'
import { Sun, Moon } from 'lucide-react'
import '../styles/ThemeToggle.css'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <label className="switch">
      <input
        className="switch__input"
        type="checkbox"
        role="switch"
        checked={dark}
        onChange={toggle}
      />

      <span className="switch__inner" />

      <span className="switch__inner-icons">
        <Sun
          size={12}
          strokeWidth={2}
          className={`switch__icon sun ${dark ? 'inactive' : ''}`}
        />
        <Moon
          size={12}
          strokeWidth={2}
          className={`switch__icon moon ${dark ? '' : 'inactive'}`}
        />
      </span>

      <span className="switch__sr">Toggle theme</span>
    </label>
  )
}


