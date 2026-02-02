import axios from 'axios'
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://0.0.0.0:1200'
const api = axios.create({ baseURL: API_BASE, withCredentials: true, headers: { 'Content-Type': 'application/json' } })
api.interceptors.response.use(r=>r, err=>{
  const ev = new CustomEvent('app:error', { detail: err })
  window.dispatchEvent(ev)
  return Promise.reject(err)
})
export default api

