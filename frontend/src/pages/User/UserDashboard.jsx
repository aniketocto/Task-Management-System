
import { useUserAuth } from '../../hooks/useUserAuth';
import React from 'react'

const UserDashboard = () => {
  useUserAuth();
  return (
    <div>UserDashboard</div>
  )
}

export default UserDashboard