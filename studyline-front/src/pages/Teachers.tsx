import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  get_teachers,
  add_teacher,
  delete_teacher,
  update_teacher_fullname,
  update_teacher_login,
  update_teacher_password,
  send_notifications_to_teachers,
} from '../api/sdk'
import Modal from '../components/Modal'
import { useError } from '../contexts/ErrorContext'
import { Trash2, PencilLine, BellRing } from 'lucide-react'

export default function Teachers() {
  const qc = useQueryClient()
  const { show } = useError()

  /* --------------------------- DATA LOADING --------------------------- */

  const { data } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => (await get_teachers()).data,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить преподавателей'),
  })

  /* --------------------------- MUTATIONS --------------------------- */

  const addMut = useMutation({
    mutationFn: async (b: any) => await add_teacher(b),
    onSuccess: () => qc.invalidateQueries(['teachers']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => await delete_teacher(id),
    onSuccess: () => qc.invalidateQueries(['teachers']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const updNameMut = useMutation({
    mutationFn: async (b: any) => await update_teacher_fullname(b),
    onSuccess: () => qc.invalidateQueries(['teachers']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const updLoginMut = useMutation({
    mutationFn: async (b: any) => await update_teacher_login(b),
    onSuccess: () => qc.invalidateQueries(['teachers']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const updPassMut = useMutation({
    mutationFn: async (b: any) => await update_teacher_password(b),
    onSuccess: () => qc.invalidateQueries(['teachers']),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  /* -------- SEND NOTIFICATIONS TO SELECTED TEACHERS -------- */

  const sendMut = useMutation({
    mutationFn: async (body: { teacher_ids: number[] }) =>
      await send_notifications_to_teachers(body),
    onSuccess: () => show('Успех', 'Уведомления отправлены!'),
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось отправить уведомления'),
  })

  /* --------------------------- LOCAL STATE --------------------------- */

  const [openAdd, setOpenAdd] = React.useState(false)
  const [newT, setNewT] = React.useState({ login: '', password: '', full_name: '' })
  const [edit, setEdit] = React.useState<{ id: number; full_name: string; login: string; password?: string } | null>(null)

  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (t: any) =>
        t.full_name?.toLowerCase().includes(q) ||
        t.login?.toLowerCase().includes(q)
    )
  }, [data, search])

  /* -------------- SELECTED TEACHERS FOR NOTIFICATIONS -------------- */

  const [selected, setSelected] = React.useState<number[]>([])

  function toggle(id: number) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  /* --------------------------- CONFIRM MODAL --------------------------- */

  const [confirmVisible, setConfirmVisible] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null)

  function confirm(text: string, action: () => void) {
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmVisible(true)
  }

  async function handleSaveEdit() {
    if (!edit) return
    try {
      if (edit.full_name.trim()) await updNameMut.mutateAsync({ id: edit.id, full_name: edit.full_name })
      if (edit.login.trim()) await updLoginMut.mutateAsync({ id: edit.id, login: edit.login })
      if (edit.password && edit.password.trim())
        await updPassMut.mutateAsync({ id: edit.id, password: edit.password })

      show('Успех', 'Изменения сохранены')
      setEdit(null)
    } catch {
      show('Ошибка', 'Не удалось сохранить изменения')
    }
  }

  /* --------------------------- RENDER --------------------------- */

  return (
    <div className="container">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3>Преподаватели</h3>

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <input
            className="input"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />

          <button className="btn" onClick={() => setOpenAdd(true)}>
            Добавить
          </button>
        </div>
      </div>

      {/* SEND NOTIFICATIONS BUTTON */}
      <button
        className="btn"
        style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center' }}
        disabled={selected.length === 0}
        onClick={() => sendMut.mutate({ teacher_ids: selected })}
      >
        <BellRing style={{ marginRight: 6 }} /> Отправить уведомления выбранным ({selected.length})
      </button>

      {/* LIST */}
      <div className="card" style={{ marginTop: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            Ничего не найдено
          </div>
        ) : (
          filtered
            .filter((t: any) => t.role !== 'admin')
            .map((t: any) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 10,
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                }}
              >
                {/* CHECKBOX */}
                <input
                  className="select_checkbox"
                  type="checkbox"
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  style={{ marginRight: 10 }}
                />

                <div style={{ flex: 1 }}>
                  <b>{t.full_name || 'Без имени'}</b>
                  <div className="small" style={{ color: 'var(--text-muted)' }}>
                    {t.login}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="nav-btn"
                    onClick={() =>
                      setEdit({
                        id: t.id,
                        full_name: t.full_name || '',
                        login: t.login || '',
                      })
                    }
                  >
                    <PencilLine />
                  </button>

                  <button
                    className="nav-btn"
                    onClick={() =>
                      confirm('Удалить этого преподавателя?', () => delMut.mutate(t.id))
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* ADD MODAL */}
      <Modal visible={openAdd} onClose={() => setOpenAdd(false)} title="Добавить преподавателя">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="input"
            placeholder="login"
            value={newT.login}
            onChange={(e) => setNewT({ ...newT, login: e.target.value })}
          />
          <input
            className="input"
            placeholder="password"
            type="password"
            value={newT.password}
            onChange={(e) => setNewT({ ...newT, password: e.target.value })}
          />
          <input
            className="input"
            placeholder="ФИО"
            value={newT.full_name}
            onChange={(e) => setNewT({ ...newT, full_name: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                if (!newT.login || !newT.password)
                  return show('Ошибка', 'login и password обязательны')
                addMut.mutate(newT)
                setOpenAdd(false)
                setNewT({ login: '', password: '', full_name: '' })
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

      {/* EDIT MODAL */}
      <Modal visible={!!edit} onClose={() => setEdit(null)} title="Редактировать преподавателя">
        {edit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>ФИО</label>
            <input
              className="input"
              value={edit.full_name}
              onChange={(e) => setEdit({ ...edit, full_name: e.target.value })}
            />

            <label>Логин</label>
            <input
              className="input"
              value={edit.login}
              onChange={(e) => setEdit({ ...edit, login: e.target.value })}
            />

            <label>Пароль</label>
            <input
              className="input"
              type="password"
              placeholder="Оставьте пустым, если не менять"
              onChange={(e) => setEdit({ ...edit, password: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={handleSaveEdit}>
                Сохранить
              </button>
              <button className="nav-btn" onClick={() => setEdit(null)}>
                Отмена
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal visible={confirmVisible} onClose={() => setConfirmVisible(false)} title="Подтверждение">
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

