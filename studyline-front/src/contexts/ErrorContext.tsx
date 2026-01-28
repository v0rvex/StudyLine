import React, { createContext, useContext, useState } from 'react'
import Modal from '../components/Modal'

type ErrorCtx = { show: (title: string, message: string) => void }

const Ctx = createContext<ErrorCtx | null>(null)

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [err, setErr] = useState<{ title: string; message: string } | null>(null)

  const show = (title: string, message: string) => {
    setErr({ title, message })
  }

  const close = () => setErr(null)

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Modal visible={!!err} title={err?.title} onClose={close}>
        <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{err?.message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={close}>ОК</button>
        </div>
      </Modal>
    </Ctx.Provider>
  )
}

export function useError() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useError must be used inside ErrorProvider')
  return c
}

