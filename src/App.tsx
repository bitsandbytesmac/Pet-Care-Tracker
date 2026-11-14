import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import LogPage from './pages/LogPage'
import MedicationsPage from './pages/MedicationsPage'
import PetProfilePage from './pages/PetProfilePage'
import TodayPage from './pages/TodayPage'
import VisitsPage from './pages/VisitsPage'
import { useAppState } from './state/AppStateContext'

function FirstPetRedirect() {
  const { pets } = useAppState()
  const first = pets[0]
  return <Navigate to={first ? `/pets/${first.id}` : '/'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="pets" element={<FirstPetRedirect />} />
        <Route path="pets/:petId" element={<PetProfilePage />} />
        <Route path="medications" element={<MedicationsPage />} />
        <Route path="visits" element={<VisitsPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
