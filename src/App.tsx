import './App.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

const Signup = lazy(() => import('./pages/Signup'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Posts = lazy(() => import('./pages/Posts'))
const PostDetails = lazy(() => import('./pages/PostDetails'))
const Analytics = lazy(() => import('./pages/Analytics'))
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/:postId" element={<PostDetails />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* auth routes (no sidebar) */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
