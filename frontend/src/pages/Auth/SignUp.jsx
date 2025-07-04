import { validateEmail, validatePassword } from "../../utils/helper";
import AuthLayout from "../../components/layouts/AuthLayout";
import React, { useState } from "react";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import Input from "components/Inputs/Input";
import SelectInput from "components/Inputs/SelectInput";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [email, setEmail] = useState([]);
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [department, setDepartment] = useState("");

  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    const errors = [];

    if (!name) {
      errors.push("Please enter your name");
    }
    if (!validateEmail(email)) {
      errors.push("Email must be a valid @getunstoppable.in address");
    }
    if (!validatePassword(password)) {
      errors.push(
        "Password must have at least 1 uppercase, 1 lowercase, 1 number, 1 special character, and be at least 8 characters long."
      );
    }
    if (password !== confirmPassword) {
      errors.push("Password and Confirm Password should be the same");
    }
    if (!department) {
      errors.push("Please select your department");
    }
    if (errors.length > 0) {
      setError(errors); // setError can be an array now
      return;
    }

    // all good
    setError([]);

    console.log({
      userData: {
        email,
        password,
        profilePic,
        name,
        adminInviteToken,
        department,
      },
    });
  };

  return (
    <AuthLayout>
      <div className="lg:w-full h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Create an Account</h3>
        <p className="text-sm text-slate-700 mt-[5px] mb-6">
          Join today by entering your details below and start managing your
          tasks effectively
        </p>

        <form onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="Name"
              placeholder="Enter your name"
              type="text"
            />
            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="example@getunstoppable.in"
              type="text"
            />
            <Input
              value={adminInviteToken}
              onChange={({ target }) => setAdminInviteToken(target.value)}
              label="Admin Token"
              placeholder="Admin Token"
              type="text"
            />
            <SelectInput
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              label="Department"
              options={[
                { value: "Creative", label: "Creative" },
                { value: "Digital", label: "Digital" },
                { value: "Social", label: "Social" },
                { value: "Influencer", label: "Influencer" },
                { value: "Development", label: "Development" },
                { value: "UiUx", label: "UI/UX" },
                { value: "Sales", label: "Sales" },
                { value: "Strategy", label: "Strategy" },
                { value: "Content", label: "Content" },
                { value: "SEO", label: "SEO" },
                { value: "BusinessDevelopment", label: "Business Development" },
                { value: "ClientServicing", label: "Client Servicing" },
              ]}
            />

            <Input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Password"
              type="password"
            />
            <Input
              value={confirmPassword}
              onChange={({ target }) => setConfirmPassword(target.value)}
              label="Confirm Password"
              placeholder="ConfirmPassword"
              type="password"
            />
          </div>

          {Array.isArray(error) && error.length > 0 && (
            <ul className="text-red-500 text-sm pb-2.5">
              {error.map((err, idx) => (
                <li key={idx}>• {err}</li>
              ))}
            </ul>
          )}

          <button type="submit" className="btn-primary">
            Sign In
          </button>
          <p className="text-[13px] text-slate-800 mt-3">
            Already have an account?
            <Link to="/login" className="text-primary font-medium underline">
              Login
            </Link>
          </p>
          <p className="text-[13px] text-slate-800 mt-3">
            Admin Sign In
            <Link to="/sign-in?admin=true" className="text-primary font-medium underline">
              Admin
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
