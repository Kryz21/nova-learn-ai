import { Routes, Route } from 'react-router-dom'
import StarField from './components/StarField'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ConfigBanner from './components/ConfigBanner'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import NewResource from './pages/NewResource'
import ResourceDetail from './pages/ResourceDetail'

export default function App() {
  return (
    <div className="min-h-screen relative">
      <StarField />
      <ConfigBanner />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <NewResource />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resource/:id"
            element={
              <ProtectedRoute>
                <ResourceDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
