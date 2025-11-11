import React, { useEffect } from 'react'
import { useMyContext } from 'Context/MyContextProvider';
import { useParams } from 'react-router-dom';

const UserEditGuard = ({ children }) => {
  const { id } = useParams();
  const { UserData, userRole } = useMyContext();

  useEffect(() => {
    // If "User" role tries to access different ID, redirect to own profile
    if (userRole === 'User' && UserData?.id && parseInt(id) !== UserData.id) {
      window.location.href = `/users/edit/${UserData.id}`;
    }
  }, [id, UserData?.id, userRole]);

  return children;
};

export default UserEditGuard;
