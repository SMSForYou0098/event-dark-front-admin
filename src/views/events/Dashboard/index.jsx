import React from 'react'
import { useMyContext } from 'Context/MyContextProvider'
import AdminDashboard from './Admin'

const Dashbaord = () => {
  const {userRole , UserData} = useMyContext()
   
  if(userRole === 'Admin'){
    return <AdminDashboard UserData={UserData}/>
  }
}

export default Dashbaord
