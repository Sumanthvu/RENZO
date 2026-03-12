import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosClient.post('/register', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      toast.success(response.data.message || 'OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosClient.post('/verify-otp', {
        email: formData.email,
        otp: formData.otp
      });
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* ── Left panel ── */}
        <section className="relative flex items-center justify-center px-8 py-10 lg:px-16 bg-[#0c0e13]">

          {/* Top-left wordmark */}
          <span className="absolute top-6 left-7 text-[15px] font-bold tracking-[0.2em] text-white uppercase select-none">RENZO</span>

          <div className="w-full max-w-[400px]">
            <h1 className="text-[38px] leading-[1.1] font-semibold tracking-tight text-white mb-2">
              {step === 1 ? 'Create your account' : 'Verify your email'}
            </h1>
            <p className="text-[15px] text-gray-400 mb-10">
              {step === 1 ? 'Sign up to start using Renzo.' : 'Enter the OTP sent to your email.'}
            </p>

            <form onSubmit={step === 1 ? handleRequestOtp : handleVerifyOtp} className="space-y-3">
              {step === 1 ? (
                <>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full name"
                    required
                    className="w-full h-[52px] px-5 rounded-full border border-white/15 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px]"
                  />
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
                </>
              ) : (
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="6-digit OTP"
                  required
                  className="w-full h-[52px] px-5 rounded-full border border-white/20 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px] tracking-[0.3em] text-center"
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-white text-black text-[15px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : (step === 1 ? 'Sign Up' : 'Verify & Enter')}
              </button>
            </form>

            <p className="mt-10 text-[15px] text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-medium hover:text-gray-300 transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </section>

        {/* ── Right visual panel ── */}
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