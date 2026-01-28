// src/pages/Groups.tsx
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import { get_groups, add_group, delete_group, edit_group } from '../api/sdk'
import Modal from '../components/Modal'
import ShiftSwitch from '../components/ShiftSwitch'
import { useError } from '../contexts/ErrorContext'
import {Trash2, PencilLine} from "lucide-react"

export default function Groups() {
  const qc = useQueryClient()
  const { show } = useError()
  const navigate = useNavigate()
  const role = Cookies.get('role') || '' // роль из куков
  const isAdmin = role === 'admin'

  const { data } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await get_groups()).data,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить группы'),
  })

  const addMut = useMutation({
    mutationFn: async (b: any) => await add_group(b),
    onSuccess: () => qc.invalidateQueries(['groups']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => await delete_group(id),
    onSuccess: () => qc.invalidateQueries(['groups']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const updMut = useMutation({
    mutationFn: async (b: any) => await edit_group(b),
    onSuccess: () => qc.invalidateQueries(['groups']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const [confirmVisible, setConfirmVisible] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null)

  function confirm(text: string, action: () => void) {
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmVisible(true)
  }
  
  const [openAdd, setOpenAdd] = React.useState(false)
  const [newG, setNewG] = React.useState({ name: '', shift: 1 })
  const [edit, setEdit] = React.useState<{ id: number; name: string; shift: number } | null>(null)
  const [search, setSearch] = React.useState('')
  const [shift, setShift] = React.useState<1 | 2>(1);

  const filtered = React.useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter((g: any) => g.name?.toLowerCase().includes(q))
  }, [data, search])

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h3>Группы</h3>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          {isAdmin && (
            <button className="btn" onClick={() => setOpenAdd(true)}>
              Добавить
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            Ничего не найдено
          </div>
        ) : (
          filtered.map((g: any) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 10,
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/group/${g.id}/true_schedule`)} // переходим на страницу группы
              >
                <b>{g.name}</b>
              </div>

              {isAdmin ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="nav-btn"
                    onClick={() => setEdit({ id: g.id, name: g.name, shift: g.shift })}
                  >
                    <PencilLine />
                  </button>
                  <button className="nav-btn" onClick={() => confirm("Удалить эту группу?", () => delMut.mutate(g.id))}>
                    <Trash2 />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* добавление */}
      <Modal visible={openAdd} onClose={() => setOpenAdd(false)} title="Добавить группу">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
          <input
            className="input"
            placeholder="Название"
            value={newG.name}
            onChange={(e) => setNewG({ name: e.target.value, shift: shift})}
          />
          <h3>Выберите смену</h3>
          <ShiftSwitch shift={newG.shift} name={newG.name} onChangeShift={setShift} onChange={setNewG} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                if (!newG.name.trim()) return show('Ошибка', 'Введите название')
                addMut.mutate(newG)
                setNewG({ name: '' })
                setOpenAdd(false)
              }}
            >
              Добавить
            </button>
            <button className="nav-btn" onClick={() => setOpenAdd(false)}>
              Отмена
            </button>
          </div>
        </div>
      </Modal>

      {/* редактирование */}
      <Modal visible={!!edit} onClose={() => setEdit(null)} title="Редактировать группу">
        {edit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="input"
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            /> 
            <h3>Выберите смену</h3>
            <ShiftSwitch shift={edit.shift} name={edit.name} onChangeShift={setShift} onEdit={setEdit} edit={edit}/>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  if (!edit.name.trim()) return show('Ошибка', 'Введите название')
                  updMut.mutate(edit)
                  setEdit(null)
                }}
              >
                Сохранить
              </button>
              <button className="nav-btn" onClick={() => setEdit(null)}>
                Отмена
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/*Подтверждение удаления*/}
      <Modal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="Подтверждение"
      >
        <p>{confirmText}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button
            className="btn"
            onClick={() => {
              confirmAction?.()
              setConfirmVisible(false)
            }}
          >
            Да
          </button>
          <button className="nav-btn" onClick={() => setConfirmVisible(false)}>
            Нет
          </button>
        </div>
      </Modal>
    </div>
  )
}

