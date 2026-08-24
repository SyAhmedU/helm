import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import Login from './Login.jsx'
import Shell from './components/Shell.jsx'
import { Spinner } from './components/ui.jsx'
import Dashboard from './admin/Dashboard.jsx'
import Institutions from './admin/Institutions.jsx'
import Batches from './admin/Batches.jsx'
import Users from './admin/Users.jsx'
import Questions from './admin/Questions.jsx'
import Assessments from './admin/Assessments.jsx'
import Courses from './admin/Courses.jsx'
import Delivery from './admin/Delivery.jsx'
import Attempts from './admin/Attempts.jsx'
import Tags from './admin/Tags.jsx'
import Logs from './admin/Logs.jsx'

export default function App() {
  const { ready, user } = useAuth()
  const [tab, setTab] = useState('dashboard')

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!user) return <Login />

  return (
    <Shell active={tab} onSelect={setTab}>
      {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
      {tab === 'institutions' && <Institutions />}
      {tab === 'batches' && <Batches />}
      {tab === 'users' && <Users />}
      {tab === 'questions' && <Questions />}
      {tab === 'assessments' && <Assessments />}
      {tab === 'courses' && <Courses />}
      {tab === 'delivery' && <Delivery />}
      {tab === 'attempts' && <Attempts />}
      {tab === 'tags' && <Tags />}
      {tab === 'logs' && <Logs />}
    </Shell>
  )
}
