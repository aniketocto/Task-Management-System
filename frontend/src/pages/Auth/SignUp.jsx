import AuthLayout from "../../components/layouts/AuthLayout";
import React, { useContext, useEffect, useState } from "react";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import Input from "../../components/Inputs/Input";
import SelectInput from "../../components/Inputs/SelectInput";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import { GoogleLogin } from "@react-oauth/google";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import SpinLoader from "../../components/layouts/SpinLoader";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const { updateUser, user } = useContext(UserContext);

  // Parse query params
  const isAdmin = new URLSearchParams(location.search).get("admin") === "true";

  const handleAdminClick = () => {
    const searchParams = new URLSearchParams(location.search);

    if (isAdmin) {
      searchParams.delete("admin");
    } else {
      searchParams.set("admin", "true");
    }

    navigate({
      pathname: "/sign-up",
      search: searchParams.toString(),
    });
  };

  // const handleSignUp = async (e) => {
  //   e.preventDefault();
  //   const errors = [];

  //   let profileImgUrl = "";

  //   if (!name) {
  //     errors.push("Please enter your name");
  //   }
  //   if (!validateEmail(email)) {
  //     errors.push("Email must be a valid @getunstoppable.in address");
  //   }
  //   if (isAdmin) {
  //     if (!adminInviteToken) {
  //       errors.push("Please enter your admin invite token");
  //     }
  //   }
  //   if (!validatePassword(password)) {
  //     errors.push(
  //       "Password must have at least 1 uppercase, 1 lowercase, 1 number, 1 special character, and be at least 8 characters long."
  //     );
  //   }
  //   if (password !== confirmPassword) {
  //     errors.push("Password and Confirm Password should be the same");
  //   }
  //   if (!department) {
  //     errors.push("Please select your department");
  //   }
  //   if (errors.length > 0) {
  //     setError(errors); // setError can be an array now
  //     return;
  //   }

  //   // all good
  //   setError([]);

  //   // 🚀 proceed with Sign up Api Call
  //   try {
  //     // upload profile if present
  //     if (profilePic) {
  //       const imgUplaodRes = await uploadImage(profilePic);
  //       profileImgUrl = imgUplaodRes.imageUrl || "";
  //     }

  //     const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
  //       name,
  //       email,
  //       password,
  //       profileImageUrl: profileImgUrl,
  //       adminInviteToken,
  //       department,
  //     });

  //     const { token, role } = response.data;

  //     if (token) {
  //       localStorage.setItem("taskManagerToken", token);
  //       updateUser(response.data);

  //       if (role === "admin" || role === "superAdmin") {
  //         navigate("/admin/dashboard");
  //       } else {
  //         navigate("/user/dashboard");
  //       }
  //     } else {
  //       setError(["Something went wrong"]);
  //     }
  //   } catch (error) {
  //     if (error.response && error.response.data) {
  //       setError([error.response.data.message]);
  //     } else {
  //       setError(["Something went wrong"]);
  //     }
  //   }
  // };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const errors = [];
      if (!department) {
        errors.push("Please select your department");
      }
      if (!designation) {
        errors.push("Please type your designation");
      }
      if (errors.length > 0) {
        setError(errors);
        return;
      }

      setError([]);

      const { credential: idToken } = credentialResponse;
      let uploadedImageUrl = "";

      if (profilePic) {
        uploadedImageUrl = await uploadToCloudinary(profilePic); // upload file
      }

      const payload = {
        idToken,
        adminInviteToken,
        department,
        designation,
        profileImage: uploadedImageUrl || "",
      };

      const { data } = await axiosInstance.post(
        API_PATHS.AUTH.GOOGLE_AUTH,
        payload
      );

      if (data.token) {
        localStorage.setItem("taskManagerToken", data.token);
        updateUser(data);
        if (data.role === "admin" || data.role === "superAdmin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        setError(["Something went wrong"]);
      }
    } catch (error) {
      console.log("Google Login Error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {loading && <SpinLoader />}

      <div className="lg:w-full h-screen md:h-full mt-10 md:mt-0 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-white">Create an Account</h3>
        <p className="text-sm text-slate-50 mt-[2px] mb-6">
          Join today by entering your details below and start managing your
          tasks effectively
        </p>

        <form>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

          <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
            {/* <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              label="Name"
              placeholder="Enter your name"
              type="text"
            /> */}
            {/* <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="example@getunstoppable.in"
              type="text"
            /> */}
            {isAdmin && (
              <Input
                value={adminInviteToken}
                onChange={({ target }) => setAdminInviteToken(target.value)}
                label="Admin Token"
                placeholder="Admin Token"
                type="text"
              />
            )}
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              label="Designation"
              placeholder="Enter your Designation"
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
                { value: "Operations", label: "Operations" },
                { value: "DevelopmentUiUx", label: "DevelopmentUiUx" },
                { value: "Strategy", label: "Strategy" },
                { value: "BusinessDevelopment", label: "Business Development" },
                { value: "ClientServicing", label: "Client Servicing" },
                { value: "Management", label: "Management" },
                { value: "HR", label: "HR" },
                // { value: "Influencer", label: "Influencer" },
                // { value: "Sales", label: "Sales" },
                // { value: "Content", label: "Content" },
                // { value: "SEO", label: "SEO" },
              ]}
            />

            {/* <Input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Password"
              type="password"
            /> */}
            {/* <Input
              value={confirmPassword}
              onChange={({ target }) => setConfirmPassword(target.value)}
              label="Confirm Password"
              placeholder="ConfirmPassword"
              type="password"
            /> */}
          </div>

          {Array.isArray(error) && error.length > 0 && (
            <ul className="text-red-500 text-sm pb-2.5">
              {error.map((err, idx) => (
                <li key={idx}>• {err}</li>
              ))}
            </ul>
          )}

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log("Google login failed")}
          />

          {/* <button
            type="submit"
            className="w-full bg-[#E43941] mt-2 hover:bg-[#C93036] text-white py-2 rounded-md cursor-pointer "
          >
            Sign In
          </button> */}
          <p className="text-[13px] text-slate-50 mt-3">
            Already have an account?{" "}
            <Link to="/login" className="text-[#E43941] font-medium ">
              Login
            </Link>
          </p>
          <p className="text-[13px] text-slate-50 mt-3">
            Admin Sign In?{" "}
            <button
              type="button"
              onClick={handleAdminClick}
              className="text-[#E43941] font-medium underline cursor-pointer"
            >
              {isAdmin ? "Cancel Admin" : "Admin"}
            </button>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
