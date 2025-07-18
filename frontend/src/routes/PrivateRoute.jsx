import { Outlet } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { useContext } from "react";

const PrivateRoute = ({ allowedRoles = [], allowedDepts = [] }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const roleOk = allowedRoles.includes(user.role);
  const deptOk = allowedDepts.includes(user.department);

  if (roleOk || deptOk) {
    return <Outlet />;
  }

  return <Navigate to="/login" />;
};

export default PrivateRoute;
