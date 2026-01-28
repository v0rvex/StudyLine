import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Cookies from "js-cookie"
import Login from "./pages/Login"
import GroupLayout from "./layouts/GroupLayout.tsx"
import ScheduleWeek from "./pages/ScheduleWeek"
import ReplacementsPage from "./pages/ReplacementsPage.tsx"
import TrueSchedulePage from "./pages/TrueSchedulePage.tsx"
import TeacherSchedulePage from "./pages/TeacherSchedulePage.tsx" 
import Groups from "./pages/Groups"
import GroupDetail from './pages/GroupDetail.tsx'
import Teachers from "./pages/Teachers"
import { ThemeProvider } from "./contexts/ThemeContext"
import { ErrorProvider } from "./contexts/ErrorContext"
import TopBar from "./components/TopBar"
import BottomNav from "./components/BottomNav"
import GearMenu from "./components/GearMenu"
import { Users, UserRoundCog, CircleUser, ClipboardClock, ClipboardCheck, Clipboard, Book} from "lucide-react"

import "./index.css";
import "./styles/global.css";

export default function App() {
  const [token, setToken] = React.useState<string | null>(null)
  const [role, setRole] = React.useState<string>("teacher")
  const isAdmin = role === 'admin'
  
  React.useEffect(() => {
    setRole(Cookies.get("role") || "teacher")
    setToken(Cookies.get("access_token") || null)
  }, []) 

  const mainNav = [
    { key: 'groups', icon: <Users />, path: '/groups', title: 'Группы' },
    { key: 'teachers', icon: <UserRoundCog />, path: '/teachers', title: 'Преподаватели', roles: ['admin'] },
    { key: 'me', icon: <CircleUser />, path: '/me', title: 'Профиль' }
  ] 

  return (
    <ThemeProvider>
      <ErrorProvider>
        <TopBar />
        <Routes>
          {!token ? (
            <Route path="*" element={<Login />} />
          ) : (
            <>
              <Route path="/" element={<Navigate to="/groups" />} />
              
              <Route path="/groups" element={<Groups />}/>

              <Route path="/group/:id/*" element={<GroupLayout />} >
                <Route path="true_schedule" element={<TrueSchedulePage />}/>
                <Route path="schedule" element={<ScheduleWeek />} />
                <Route path="replacements" element={<ReplacementsPage />} />
                <Route path="subjects" element={<GroupDetail />} />

              
              </Route>
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/me" element={<TeacherSchedulePage />} />
            </>
          )}
        </Routes>
        {token && (<BottomNav items={mainNav} visibleOn={['/groups', '/teachers', '/me']}/>)}
        <GearMenu />
      </ErrorProvider>
    </ThemeProvider>
  )
}


