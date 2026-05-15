import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { BgmProvider } from './bgm/BgmProvider'
import { WelcomePage } from './pages/WelcomePage'
import { LoginPage } from './pages/LoginPage'
import { GameShell } from './pages/GameShell'
import { FarmPage } from './pages/FarmPage'
import { ShopPage } from './pages/ShopPage'
import { InventoryPage } from './pages/InventoryPage'
import { TasksPage } from './pages/TasksPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BgmProvider>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/game" element={<GameShell />}>
              <Route index element={<Navigate to="farm" replace />} />
              <Route path="farm" element={<FarmPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BgmProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
