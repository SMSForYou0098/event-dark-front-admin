import React from 'react'
import { useNavigate } from 'react-router-dom'

const UseNavigation = (path) => {
  const navigate  = useNavigate();
  return () => navigate(path);
}

export default UseNavigation
