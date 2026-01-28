import React from 'react'
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom'
import GroupDetailPage from '../pages/GroupDetailPage.tsx'
import BottomNav from '../components/BottomNav'
import { ClipboardCheck, Clipboard, ClipboardClock, Book } from 'lucide-react'

export default function GroupLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const loc = useLocation()
  const gid = Number(id)

  React.useEffect(() => {
    if (gid && loc.pathname === `/group/${gid}`) {
      navigate(`/group/${gid}/true_schedule`, { replace: true })
    }
  }, [gid, loc.pathname, navigate])

  const bottomItems = [
    { key: 'trueSchedule', icon: <ClipboardCheck />, path: `/group/${id}/true_schedule`, title: 'Итоговое расписание'},
    { key: 'schedule', icon: <Clipboard />, path: `/group/${id}/schedule`, title: 'Базовое расписание'},
    { key: 'scheduleChanges', icon: <ClipboardClock />, path: `/group/${id}/replacements`, title: 'Замены'},
    { key: 'subjects', icon: <Book />, path: `/group/${id}/subjects`, title: 'Предметы'}
  ]

  if (!gid)
    return (
      <div className="container">
        <div className="card">Группа не найдена</div>
      </div>
    )

  return (
    <>
      <Outlet/>
      <BottomNav items={bottomItems} visibleOn={[`/group/${gid}` , `/group/${gid}/schedule`, `/group/${gid}/subjects`, `/group/${gid}/replacements`, `/group/${gid}/true_schedule`]}/>
    </>
  )
}
