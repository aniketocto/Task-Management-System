import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";

import Dashboard from "./pages/Admin/Dashboard";
import ManageTask from "./pages/Admin/ManageTask";
import ManageUser from "./pages/Admin/ManageUser";
import CreateTask from "./pages/Admin/CreateTask";

import UserDashboard from "./pages/User/UserDashboard";
import MyTasks from "./pages/User/MyTasks";
import ViewTaskDetails from "./pages/User/ViewTaskDetails";
import PrivateRoute from "./routes/PrivateRoute";
import UserProvider from "./context/userProvider";
import { useContext } from "react";
import { UserContext } from "./context/userContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/tasks" element={<ManageTask />} />
              <Route path="/admin/users" element={<ManageUser />} />
              <Route path="/admin/create-task" element={<CreateTask />} />
            </Route>

            {/* User Routes */}
            <Route element={<PrivateRoute allowedRoles={["user"]} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/admin/my-tasks" element={<MyTasks />} />
              <Route
                path="/admin/task-detail/:id"
                element={<ViewTaskDetails />}
              />
            </Route>
            {/* Deafult Routes */}
            <Route path="/" element={<Root />} />
          </Routes>
        </Router>
      </div>

      <Toaster
        toastOptions={{
          className: "",
          duration: 3000,
          style: {
            fontSize: "13px",
          },
        }}
      />
    </UserProvider>
  );
}

export default App;

const Root = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <Outlet />;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return user.role === "admin" || user.role === "superAdmin" ? (
    <Navigate to="/admin/dashboard" />
  ) : (
    <Navigate to="/user/dashboard" />
  );
};
