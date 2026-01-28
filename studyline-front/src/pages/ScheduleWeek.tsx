// src/pages/ScheduleWeek.tsx
import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import {
  get_schedule,
  add_schedule_day,
  edit_schedule_day,
  delete_schedule_day,
  delete_schedule_pair,
  get_teachers,
  get_subjects_by_group_id,
  get_group_by_id,
  get_teacher_links,
} from '../api/sdk'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Modal from '../components/Modal'
import SearchSelect from '../components/SearchSelect.tsx'
import { useError } from '../contexts/ErrorContext'
import type { Pair } from '../api/types'
import { Trash2, PencilLine, Save, Plus } from 'lucide-react'
import { SHIFT_TIMES } from "../constants.ts"

type EditPair = Pair & { localId: string }

export default function ScheduleWeek() {
  const groupId = useParams<{ groupId: string }>().id
  const gid = Number(groupId || 0)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { show } = useError()
  const isAdmin = Cookies.get('role') === 'admin'

  /* --- загрузка данных --- */
  const { data: schedRaw } = useQuery({
    queryKey: ['schedule', gid],
    queryFn: async () => (await get_schedule(gid)).data,
    enabled: !!gid,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось загрузить расписание'),
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers_filtered', gid],
    queryFn: async () => {
      const [teachersRes, linksRes] = await Promise.all([
        get_teachers(),
        get_teacher_links(gid),
      ]);

      const teachers = teachersRes.data || []
      const links = linksRes.data || []
      

      const allowedIds = new Set(links.map(l => l.teacher_id));

      return teachers.filter(t => allowedIds.has(t.id));
    },
    staleTime: 60_000,
  })

  const { data: links } = useQuery({
    queryKey: ['links', gid],
    queryFn: async () => (await get_teacher_links(gid)).data,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects', gid],
    queryFn: async () => (await get_subjects_by_group_id(gid)).data,
    enabled: !!gid,
  })

  const { data: group } = useQuery({
    queryKey: ['group', gid],
    queryFn: async () => (await get_group_by_id(gid)).data,
    enabled: !!gid,
  })

  /* --- нормализация --- */
  const normalized = React.useMemo(() => {
    const map = new Map<number, EditPair[]>()
    if (!schedRaw) return map

    for (const s of schedRaw) {
      const day = s.weekday
      const pairs = (s.pairs || []).map((p: any) => ({
        ...p,
        localId:
          p.localId ||
          `${day}-${p.id || `temp-${Math.random().toString(36).slice(2, 8)}`}`,
      }))
      map.set(day, pairs)
    }
    return map
  }, [schedRaw])

  const [days, setDays] = React.useState<Map<number, EditPair[]>>(new Map())
  React.useEffect(() => setDays(new Map(normalized)), [normalized])

  /* --- модалки --- */
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editDay, setEditDay] = React.useState<number | null>(null)
  const [editPair, setEditPair] = React.useState<EditPair | null>(null)
  const [confirmVisible, setConfirmVisible] = React.useState(false)
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null)
  const [confirmText, setConfirmText] = React.useState('')

  /* --- мутации --- */
  const addMut = useMutation({
    mutationFn: async (payload: any) => await add_schedule_day(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', gid] }),
  })
  const editMut = useMutation({
    mutationFn: async (payload: any) => await edit_schedule_day(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', gid] }),
  })
  const delMut = useMutation({
    mutationFn: async ({ group_id, weekday }: { group_id: number; weekday: number }) =>
      await delete_schedule_day(group_id, weekday),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', gid] }),
  })
  const delPairMut = useMutation({
    mutationFn: async (id: number) => await delete_schedule_pair(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule', gid] }),
  })

  function confirm(text: string, action: () => void) {
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmVisible(true)
  }

  function openNew(day: number) {
    if ((days.get(day)?.length || 0) >= 12) {
      show('Ошибка', 'Максимум 12 карточек в день')
      return
    }
    
    const shift = group?.shift || 1; // 1 или 2
    const pairNum = (days.get(day)?.length || 0);
    
    const [start, end] = SHIFT_TIMES[shift][pairNum] || ["09:00", "10:00"];

    const uuid =
      (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `r${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`

    setEditDay(day)
    setEditPair({
      id: -Date.now(),
      localId: `${day}-temp-${uuid}`,
      pair_number: (days.get(day)?.length || 0) + 1,
      teacher_id: 0,
      subject_id: 0,
      start_time: start,
      end_time: end,
      cabinet: '',
    })
    setModalOpen(true)
  }

  function openEdit(day: number, p: EditPair) {
    setEditDay(day)
    setEditPair({ ...p })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditPair(null)
    setEditDay(null)
  }

  // 💾 сохраняет одну пару (через add_schedule_day)
  function applySave() {
    if (editDay == null || !editPair) return
    if (!editPair.subject_id || !editPair.teacher_id) {
      show('Ошибка', 'Выберите предмет и преподавателя')
      return
    }

    const isNew = editPair.id < 0

    if (isNew) {
      // ---------------------------
      //  ░░ Добавление пары ░░
      // ---------------------------
      const payload = {
        group_id: gid,
        weekday: editDay,
        pairs: [
          {
            pair_number: (days.get(editDay)?.length || 0) + 1,
            teacher_id: editPair.teacher_id,
            subject_id: editPair.subject_id,
            start_time: editPair.start_time,
            end_time: editPair.end_time,
            cabinet: editPair.cabinet,
          },
        ],
      }

      addMut.mutate(payload, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ['schedule', gid] })
          show('Успех', 'Урок добавлен')
        },
        onError: (e: any) => show('Ошибка', e?.message || 'Не удалось добавить урок'),
      })
    } else {
      // ---------------------------
      //  ░░ Редактирование пары ░░
      // ---------------------------
      const payload = {
        group_id: gid,
        weekday: editDay,
        pairs: [
          {
            id: editPair.id,
            pair_number: editPair.pair_number,
            teacher_id: editPair.teacher_id,
            subject_id: editPair.subject_id,
            start_time: editPair.start_time,
            end_time: editPair.end_time,
            cabinet: editPair.cabinet,
          },
        ],
      }

      editMut.mutate(payload, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ['schedule', gid] })
          show('Успех', 'Урок обновлен')
        },
        onError: (e: any) => show('Ошибка', e?.message || 'Не удалось обновить урок'),
      })
    }

    closeModal()
  }

  function removePair(day: number, id: number) {
    confirm('Удалить этот урок?', () => {
      delPairMut.mutate(id, {
        onSuccess: () => {
          const updated = (days.get(day) || []).filter((p) => p.id !== id)
          setDays(new Map(days.set(day, updated)))
          show('Успех', 'Урок удален')
        },
        onError: (e: any) => show('Ошибка', e?.message || 'Не удалось удалить пару'),
      })
    })
  }

  function removeDay(day: number) {
    confirm('Удалить расписание целого дня?', () => {
      delMut.mutate({ group_id: gid, weekday: day })
    })
  }

  function onDragEnd(result: DropResult) {
    if (!isAdmin) return;
    if (!result.destination) return;

    const src = Number(result.source.droppableId);
    const dst = Number(result.destination.droppableId);
    const srcIndex = result.source.index;
    const dstIndex = result.destination.index;

    const shift = group?.shift ?? 1;
    const times = SHIFT_TIMES[shift];

    // 🟦 ПЕРЕМЕЩЕНИЕ ВНУТРИ ОДНОГО ДНЯ
    if (src === dst) {
      const list = [...(days.get(src) || [])];

      const [moved] = list.splice(srcIndex, 1);
      list.splice(dstIndex, 0, moved);

      const normalized = list.map((p, i) => ({
        ...p,
        pair_number: i + 1,
        start_time: times[i][0],
        end_time: times[i][1],
      }));

      setDays(new Map(days).set(src, normalized));
      return;
    }

    // 🟩 ПЕРЕМЕЩЕНИЕ МЕЖДУ ДНЯМИ (другое поведение)
    const srcList = [...(days.get(src) || [])];
    const dstList = [...(days.get(dst) || [])];

    const [moved] = srcList.splice(srcIndex, 1);
    dstList.splice(dstIndex, 0, moved);

    const newSrc = srcList.map((p, i) => ({
      ...p,
      pair_number: i + 1,
      start_time: times[i][0],
      end_time: times[i][1],
    }));

    const newDst = dstList.map((p, i) => ({
      ...p,
      pair_number: i + 1,
      start_time: times[i][0],
      end_time: times[i][1],
    }));

    const next = new Map(days);
    next.set(src, newSrc);
    next.set(dst, newDst);
    setDays(next);
  }


  async function saveAll() {
    try {
      for (const [day, list] of days.entries()) {
        if (!list.length) continue
        const payload = {
          group_id: gid,
          weekday: day,
          pairs: list.map(
            ({
              id,
              pair_number,
              teacher_id,
              subject_id,
              start_time,
              end_time,
              cabinet,
            }) => ({
              id: id > 0 ? id : undefined,
              pair_number,
              teacher_id,
              subject_id,
              start_time,
              end_time,
              cabinet,
            })
          ),
        }
        await editMut.mutateAsync(payload)
      }
      show('Успех', 'Все изменения сохранены')
      qc.invalidateQueries({ queryKey: ['schedule', gid] })
    } catch {
      show('Ошибка', 'Не удалось сохранить изменения')
    }
  }

  const tName = (id: number) =>
    teachers?.find((t: any) => t.id === id)?.full_name ||
    teachers?.find((t: any) => t.id === id)?.name ||
    `Преп. #${id}`

  const sName = (id: number) =>
    subjects?.find((s: any) => s.id === id)?.name || `Предм. #${id}`

  if (!gid)
    return (
      <div className="container">
        <div className="card">
          Выберите группу{' '}
          <button className="btn" onClick={() => navigate('/groups')}>
            Перейти к группам
          </button>
        </div>
      </div>
    )

  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  
  

  return (
    <div className="container">
      <h3>Расписание (без замен) — {group?.name || `Группа #${gid}`}</h3>

      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '12px',
          marginTop: '12px',
        }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          {weekdays.map((label, idx) => {
            const day = idx + 1
            const pairs = days.get(day) || []
            return (
              <Droppable key={day} droppableId={String(day)} isDropDisabled={!isAdmin}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="day-cell"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '320px',
                      padding: '8px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--card)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <b>{label}</b>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn" onClick={() => openNew(day)}>
                            <Plus />
                          </button>
                          {pairs.length > 0 && (
                            <button className="nav-btn" onClick={() => removeDay(day)}>
                              <Trash2 />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {pairs.map((p, idx) => (
                      <Draggable
                        key={p.localId}
                        draggableId={p.localId}
                        index={idx}
                        isDragDisabled={!isAdmin}
                      >
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`pair ${snap.isDragging ? 'dragging' : ''}`}
                            style={{
                              ...prov.draggableProps.style,
                              marginBottom: '8px',
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              boxShadow: snap.isDragging
                                ? '0 0 10px rgba(0,0,0,0.3)'
                                : undefined,
                              transition: '.15s',
                              cursor: isAdmin ? 'grab' : 'default',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.8em' }}>{sName(p.subject_id)}</div>
                            <div className="small">
                              {tName(p.teacher_id)} | {p.start_time}–{p.end_time}{' '}
                              {p.cabinet && `| ${p.cabinet}`}
                            </div>
                            {isAdmin && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  gap: 6,
                                  marginTop: 4,
                                }}
                              >
                                <button className="nav-btn" onClick={() => openEdit(day, p)}>
                                  <PencilLine />
                                </button>
                                <button className="nav-btn" onClick={() => removePair(day, p.id)}>
                                  <Trash2 />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )
          })}
        </DragDropContext>
      </div>

      {isAdmin && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button
            className="btn"
            onClick={saveAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Save /> Сохранить изменения
          </button>
        </div>
      )}

      {/* модалки */}
      <Modal
        visible={modalOpen}
        onClose={closeModal}
        title="Добавить/обновить пару"
      >
        {editPair && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>Предмет</label>
            <SearchSelect
              value={editPair.subject_id}
              onChange={(e) =>{
                  const subject_id = Number(e);
                  const link = (links || []).find(l => l.subject_id === subject_id);
                  const teacher_id = link ? link.teacher_id : editPair.teacher_id;
                  setEditPair({ ...editPair, subject_id, teacher_id })
                }
              }
              options={(subjects || []).map(s => ({
                value: s.id,
                label: s.name
              }))}
            />

            <label>Преподаватель</label>
            <SearchSelect
              value={editPair.teacher_id}
              onChange={(e) =>
                setEditPair({ ...editPair, teacher_id: Number(e) })
              }
              options={(teachers || []).map(t => ({
                value: t.id,
                label: t.full_name
              }))}
              placeholder="Выберите преподавателя"
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={editPair.start_time}
                onChange={(e) =>
                  setEditPair({ ...editPair, start_time: e.target.value })
                }
              />
              <input
                className="input"
                value={editPair.end_time}
                onChange={(e) =>
                  setEditPair({ ...editPair, end_time: e.target.value })
                }
              />
            </div>

            <input
              className="input"
              value={editPair.cabinet || ''}
              placeholder="Кабинет"
              onChange={(e) =>
                setEditPair({ ...editPair, cabinet: e.target.value })
              }
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={applySave}>
                Сохранить
              </button>
              <button className="nav-btn" onClick={closeModal}>
                Отмена
              </button>
            </div>
          </div>
        )}
      </Modal>

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

