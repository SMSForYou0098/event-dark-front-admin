import React from 'react'
import { useMyContext } from 'Context/MyContextProvider'
import AdminDashboard from './Admin'
import OrgDashboard from './Organizer'

const Dashbaord = () => {
  const {userRole , UserData} = useMyContext()
   
  if(userRole === 'Admin'){
    return <AdminDashboard UserData={UserData} userRole={userRole}/>
  }else if(userRole === 'Organizer'){
    return <OrgDashboard UserData={UserData}/>
  }
}

export default Dashbaord
