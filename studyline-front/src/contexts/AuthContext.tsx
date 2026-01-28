import React, { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { login as sdkLogin, logout as sdkLogout } from '../api/sdk'
import type { LoginRequest } from '../api/types'

type Auth = { token?: string | null; login: (p: LoginRequest)=>Promise<void>; logout: ()=>Promise<void> }
const AuthContext = createContext<Auth | null>(null)

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | undefined>(() => Cookies.get('token'))

  useEffect(()=> {
    const t = Cookies.get('token')
    if (t) setToken(t)
  }, [])

  const login = async (p: LoginRequest) => {
    const res = await sdkLogin(p)
    const tk = res.data?.token
    if (tk) Cookies.set('token', tk, { expires: 1, sameSite: 'lax' })
    setToken(tk || Cookies.get('token'))
  }

  const logout = async () => {
    try { await sdkLogout() } catch {}
    Cookies.remove('token')
    setToken(undefined)
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = ()=> {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

