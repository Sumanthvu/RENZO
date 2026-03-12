import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axiosClient from "../api/axiosClient";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosClient.post("/login", formData);
      toast.success(response.data.message || "Logged in successfully!");
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
      setTimeout(() => navigate("/chat"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* ── Left panel ── */}
        <section className="relative flex items-center justify-center px-8 py-10 lg:px-16 bg-[#18191c]">

          {/* Top-left mini logo */}
          <img src="/temp/renzologo.png" alt="Renzo" className="absolute top-6 left-6 h-6 w-6 object-contain" />

          <div className="w-full max-w-[400px]">
            <h1 className="text-[38px] leading-[1.1] font-semibold tracking-tight text-white mb-10">
              Log into your account
            </h1>

            {/* Form + actions */}
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full h-[52px] px-5 rounded-full border border-white/15 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px]"
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full h-[52px] px-5 rounded-full border border-white/15 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px]"
              />
              <div className="flex justify-end pr-1">
                <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-white text-black text-[15px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="space-y-3 mt-3">
              {/* Google login pill */}
              <div className="w-full h-[52px] rounded-full border border-white/12 bg-[#0e1016] flex items-center justify-center overflow-hidden">
                <GoogleLogin
                  theme="filled_black"
                  size="large"
                  shape="pill"
                  onSuccess={async (credentialResponse) => {
                    try {
                      setLoading(true);
                      const response = await axiosClient.post("/google-login", {
                        credential: credentialResponse.credential,
                      });
                      toast.success("Logged in with Google!");
                      localStorage.setItem("user", JSON.stringify(response.data.data.user));
                      setTimeout(() => navigate("/chat"), 1500);
                    } catch (error) {
                      toast.error("Google Login Failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => toast.error("Google Sign In was unsuccessful")}
                />
              </div>
            </div>

            <p className="mt-10 text-[15px] text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-white font-medium hover:text-gray-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </section>

        {/* ── Right visual panel ── */}
        <section className="relative hidden lg:block overflow-hidden bg-[#0a0b0e]">
          <img
            src="/temp/renzologo.png"
            alt="Renzo"
            className="absolute inset-0 w-full h-full object-cover opacity-[1.02] select-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_95%_5%,rgba(210,230,255,0.55)_0%,rgba(120,160,220,0.18)_35%,rgba(5,8,15,0.85)_68%)]" />
        </section>

      </div>
    </div>
  );
}
