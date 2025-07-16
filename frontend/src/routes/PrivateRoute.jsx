import React from 'react'
import { Outlet } from 'react-router-dom'

// eslint-disable-next-line no-unused-vars
const PrivateRoute = ({allowedRoles}) => {
  return <Outlet allowedRoles={allowedRoles} />
}

export default PrivateRoute