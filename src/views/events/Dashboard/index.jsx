import React from 'react'
import { useMyContext } from 'Context/MyContextProvider'
import { Navigate } from 'react-router-dom'
import AdminDashboard from './Admin'
import OrgDashboard from './Organizer'

const Dashbaord = () => {
  const { userRole, UserData } = useMyContext()

  if (userRole === 'Admin') {
    return <AdminDashboard UserData={UserData} userRole={userRole} />
  } else if (userRole === 'Organizer') {
    return <OrgDashboard UserData={UserData} />
  }

  const role = userRole?.toLowerCase()
  if (['agent', 'pos', 'sponsor'].includes(role)) {
    return <Navigate to={`/dashboard/${role}`} replace />
  }

  return null
}

export default Dashbaord
