// src/pages/GroupDetail.tsx
import React from 'react'
import Cookies from 'js-cookie'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get_group_by_id, get_subjects_by_group_id, get_teachers, add_subject, delete_subject, add_teacher_link, get_teacher_links } from '../api/sdk'
import Modal from '../components/Modal'
import SearchSelect from '../components/SearchSelect.tsx'
import { useError } from '../contexts/ErrorContext'
import { Trash2, UserRoundPlus, UserRoundPen } from "lucide-react"

export default function GroupDetail({ onClose }: { onClose: ()=>void }) {
  const groupId = Number(useParams<{ groupId: string }>().id)
  const qc = useQueryClient()
  const { show } = useError()
  
  const { data: subjects, isLoading: subjectsLoading } = useQuery({ 
    queryKey: ['subjects', groupId],
    queryFn: async () => (await get_subjects_by_group_id(groupId)).data,
    enabled: !!groupId,
    onError: (e:any)=> show('Ошибка', e?.message) 
  })
  
  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: ['links', groupId],
    queryFn: async () => (await get_teacher_links(groupId)).data,
    enabled: !!groupId,
    onError: (e:any)=> show('Ошибка', e?.message) 
  })

  const { data: groupName, isLoading: groupLoading } = useQuery({
    queryKey: ['groups_name', groupId],
    queryFn: async () => (await get_group_by_id(groupId)).data.name,
    enabled: !!groupId,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить имя группы'),
  })

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachersModal', groupId],
    queryFn: async () => (await get_teachers()).data,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить преподавателей')
  })

  const addSubMut = useMutation({ 
    mutationFn: async (b: any)=> (await add_subject(b, groupId)).data,
    onSuccess: ()=> qc.invalidateQueries(['subjects', groupId]),
    onError:(e:any)=> show('Ошибка', e?.message) 
  })
  
  const delMut = useMutation({
    mutationFn: async (id: number) => await delete_subject(id),
    onSuccess: () => qc.invalidateQueries(['subjects', groupId]),
    onError: (e: any) => show('Ошибка', e?.message),
  })

  const addLinkMut = useMutation({
    mutationFn: async ({ groupId, teacherId, subjectId }: { groupId:number, teacherId:number, subjectId:number }) =>
      (await add_teacher_link({ group_id: groupId, teacher_id: teacherId, subject_id: subjectId })).data,
    onSuccess: () => qc.invalidateQueries(['links', groupId]),
    onError: (e:any) => show('Ошибка', e?.message)
  })

  const [subjectId, setSubjectId] = React.useState(0) 
  const [openAddLink, setOpenAddLink] = React.useState(false)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [name, setName] = React.useState('')
  const [teacherId, setTeacherId] = React.useState(0) 
  const [confirmVisible, setConfirmVisible] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null)

  function confirm(text: string, action: () => void) {
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmVisible(true)
  }

  // Если данные еще загружаются — показываем простой загрузочный экран
  if (subjectsLoading || linksLoading || groupLoading || teachersLoading) {
    return <Modal visible={true} title="Загрузка..." onClose={onClose}><div>Загрузка...</div></Modal>
  }
  const isAdmin = Cookies.get('role') === 'admin'

  return (
    <Modal visible={true} title={`${groupName}`} onClose={onClose}>
      <div style={{ display:'flex', gap:12 }}>
        <div style={{ flex:1 }}>
          <h4>Предметы и преподаватели</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {(subjects||[]).map((s:any) => {
              const link = links?.find(item => item.subject_id === s.id)
              const teacher = link ? teachers?.find(t => t.id === link.teacher_id) : null
              return (
                <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
                  <div>
                    {s.name} | {teacher ? teacher.full_name : 'Не назначен'}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {isAdmin && (
                      <button className="nav-btn" style={{ scale: '85%' }} onClick={() => {setOpenAddLink(true); setSubjectId(s.id)}}>
                        {link ? <UserRoundPen/> : <UserRoundPlus/>}
                      </button>
                    )}
                    {isAdmin && (
                      <button className="nav-btn" style={{ scale: '85%' }} onClick={() => confirm("Удалить этот предмет?", () => {delMut.mutate(s.id)})}>
                        <Trash2 />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {isAdmin && (
              <div style={{ marginTop:8 }}>
                <button className="btn" onClick={()=> setOpenAdd(true)}>Добавить предмет</button>
              </div>
            )}
          </div>
        </div> 
      </div>
      
      <Modal visible={openAddLink} title="Закрепить преподавателя" onClose={()=> setOpenAddLink(false)}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <SearchSelect
            value={teacherId}
            options={(teachers || []).map(t => ({
              value: t.id,
              label: t.full_name
            }))}
            onChange={(v) => setTeacherId(Number(v))}
            placeholder="Выберите преподавателя"
          />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button className="btn" onClick={()=> {
              if (teacherId === 0) return show('Ошибка','Выберите преподавателя'); 
                addLinkMut.mutate({ 
                  groupId, 
                  teacherId, 
                  subjectId 
                });
              setOpenAddLink(false);
              }}>
              Сохранить
            </button>
            <button className="nav-btn" onClick={()=> setOpenAddLink(false)}>Отмена</button>
          </div>
        </div>
      </Modal>

      <Modal visible={openAdd} title="Добавить предмет" onClose={()=> setOpenAdd(false)}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <input className="input" value={name} onChange={e=> setName(e.target.value)} placeholder="Название предмета" />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button className="btn" onClick={()=> {
                if (!name.trim()) return show('Ошибка','Введите название'); 
                addSubMut.mutateAsync({ name: name.trim(), group_id: groupId });
                setOpenAdd(false);
                setName('')
              }}>
              Добавить
            </button>
            <button className="nav-btn" onClick={()=> setOpenAdd(false)}>Отмена</button>
          </div>
        </div>
      </Modal>

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

    </Modal>
  )
}

