import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import { validateEmail, validatePassword } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

import { UserContext } from "../../context/userContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState([]);

  const navigate = useNavigate();

  const { updateUser } = useContext(UserContext);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();

    const errors = [];

    if (!validateEmail(email)) {
      errors.push("Email must be a valid @getunstoppable.in address");
    }

    if (!validatePassword(password)) {
      errors.push(
        "Password must have at least 1 uppercase, 1 lowercase, 1 number, 1 special character, and be at least 8 characters long."
      );
    }

    if (errors.length > 0) {
      setError(errors); // display errors
      return; // ⛔ stop here
    }

    setError([]); // no errors

    // 🚀 proceed with Login Api Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role } = response.data;

      if (token) {
        localStorage.setItem("taskManagerToken", token);
        updateUser(response.data);

        if (role === "admin" || role === "superAdmin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        setError(["Something went wrong"]);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError([error.response.data.message]);
      } else {
        setError(["Something went wrong"]);
      }
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-screen flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-white">Welcome Back</h3>
        <p className="text-sm text-slate-200">
          Please Enter your details to login
        </p>

        <form onSubmit={handleLogin} className="mt-8">
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="example@getunstoppable.in"
            type="text"
          />
          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Password"
            type="password"
          />

          {Array.isArray(error) && error.length > 0 && (
            <ul className="text-red-500 text-sm pb-2.5">
              {error.map((err, idx) => (
                <li key={idx}>• {err}</li>
              ))}
            </ul>
          )}

          <button type="submit" className="w-full bg-[#E43941]  hover:bg-[#C93036] text-white py-2 rounded-md cursor-pointer ">
            Login
          </button>
          <p className="text-[13px] text-slate-50 mt-3">
            Don't have an account? {" "}
            <Link to="/sign-up" className="text-[#E43941] font-medium">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
