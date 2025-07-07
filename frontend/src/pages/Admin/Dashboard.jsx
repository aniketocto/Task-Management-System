import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import React, { useContext } from "react";

const Dashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);

  return <DashboardLayout>Dashboard</DashboardLayout>;
};

export default Dashboard;
