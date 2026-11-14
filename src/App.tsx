import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import AddPetPage from './pages/AddPetPage'
import LogPage from './pages/LogPage'
import LoginPage from './pages/LoginPage'
import MedicationsPage from './pages/MedicationsPage'
import PetProfilePage from './pages/PetProfilePage'
import TodayPage from './pages/TodayPage'
import VisitsPage from './pages/VisitsPage'
import { AppStateProvider } from './state/AppStateProvider'
import { useAppState } from './state/AppStateContext'

function FirstPetRedirect() {
  const { pets } = useAppState()
  const first = pets[0]
  return <Navigate to={first ? `/pets/${first.id}` : '/pets/new'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppStateProvider>
              <AppLayout />
            </AppStateProvider>
          </RequireAuth>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="pets" element={<FirstPetRedirect />} />
        <Route path="pets/new" element={<AddPetPage />} />
        <Route path="pets/:petId" element={<PetProfilePage />} />
        <Route path="medications" element={<MedicationsPage />} />
        <Route path="visits" element={<VisitsPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
