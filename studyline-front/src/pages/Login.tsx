import React, { useState } from "react"
import Cookies from "js-cookie"
import { login } from "../api/sdk"
import Modal from "../components/Modal"
import { useError } from "../contexts/ErrorContext"

export default function Login() {
  const [loginData, setLoginData] = useState({ login: "", password: "" })
  const { show } = useError()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await login(loginData)

      const token =
        r?.data?.token || r?.token || r?.token || null
      const role = r?.data?.role || 'teacher'
      const id = r?.data?.id
      console.log(role)
      if (token) {
        Cookies.set("id", id, {expires: 1})
        Cookies.set("access_token", token, { expires: 1 })
        Cookies.set("role", role, { expires: 1 })
        window.location.href = "/groups"
      } else {
        show("Ошибка входа", "Неверный логин или пароль")
      }
    } catch (err: any) {
      show("Ошибка входа", err?.message || "Не удалось подключиться к серверу")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        animation: "fadeIn .4s ease",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 32,
          borderRadius: 12,
          background: "var(--card-bg)",
          boxShadow: "0 4px 10px rgba(0,0,0,.3)",
          minWidth: 320,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>Вход</h2>
        <input
          placeholder="Логин"
          className="input"
          value={loginData.login}
          onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
        />
        <input
          type="password"
          placeholder="Пароль"
          className="input"
          value={loginData.password}
          onChange={(e) =>
            setLoginData({ ...loginData, password: e.target.value })
          }
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "..." : "Войти"}
        </button>
      </form>
    </div>
  )
}

