import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import { validateEmail, validatePassword } from "../../utils/helper";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Email must be a valid @getunstoppable.in address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Please enter the password");
      return;
    }

    setError("");

    // Login Api Call
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Welcome Back</h3>
        <p className="text-sm text-slate-700">
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

          {error && <p className="text-sm text-red-500 pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary">
            Login
          </button>
          <p className="text-[13px] text-slate-800 mt-3">
            Don't have an account?
            <Link to="/sign-up" className="text-primary font-medium underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
