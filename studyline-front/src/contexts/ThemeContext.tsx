import React, { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"

type Theme = "light" | "dark"

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  toggle: () => {},
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const saved = (Cookies.get("theme") as Theme) || "light"
    setTheme(saved)
    document.documentElement.dataset.theme = saved
  }, [])

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.dataset.theme = next
    Cookies.set("theme", next, { expires: 7 })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

