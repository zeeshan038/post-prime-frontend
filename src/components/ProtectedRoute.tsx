import React, { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type Props = {
  children: ReactNode
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  if (!token) {
    // redirect to login and save current location
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
