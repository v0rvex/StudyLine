// src/components/Confirm.tsx
import React from 'react'
import Modal from './Modal'

export default function Confirm({ visible, title='Подтвердите', text, onOk, onCancel }: { visible:boolean, title?:string, text:string, onOk: ()=>void, onCancel: ()=>void }) {
  return (
    <Modal visible={visible} title={title} onClose={onCancel}>
      <p>{text}</p>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button className="nav-btn" onClick={onCancel}>Отмена</button>
        <button className="btn" onClick={onOk}>OK</button>
      </div>
    </Modal>
  )
}

