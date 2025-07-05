import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const acessToken = localStorage.getItem("token");
    if (acessToken) {
      config.headers.Authorization = `Bearer ${acessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again", error.response.data);
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timed out. Please try again", error.message);
    } else {
      console.error("An error occurred. Please try again", error.message);
    }
    return Promise.reject(error);
  }
);
