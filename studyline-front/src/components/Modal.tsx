import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

export default function Modal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean
  title?: string
  children?: React.ReactNode
  onClose?: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose && onClose()
    }
    if (visible) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, onClose])

  if (!visible) return null
  return ReactDOM.createPortal(
    <div className="modal-bg" onMouseDown={() => onClose && onClose()}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  )
}

