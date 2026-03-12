import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Request OTP for password reset
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosClient.post('/forgot-password', {
        email: formData.email
      });
      toast.success(response.data.message || 'Reset OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosClient.post('/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP or failed to reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

        <section className="relative flex items-center justify-center px-8 py-10 lg:px-16 bg-[#18191c]">
          <img src="/temp/renzologo.png" alt="Renzo" className="absolute top-6 left-6 h-6 w-6 object-contain" />

          <div className="w-full max-w-[400px]">
            <h1 className="text-[38px] leading-[1.1] font-semibold tracking-tight text-white mb-2">
              {step === 1 ? 'Reset Password' : 'Verify & Reset'}
            </h1>
            <p className="text-[15px] text-gray-400 mb-10">
              {step === 1 ? 'Enter your email to receive a reset code.' : 'Enter OTP and your new password.'}
            </p>

            <form onSubmit={step === 1 ? handleRequestResetOtp : handleResetPassword} className="space-y-3">
              {step === 1 ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="w-full h-[52px] px-5 rounded-full border border-white/15 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px]"
                />
              ) : (
                <>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="6-digit OTP"
                    required
                    className="w-full h-[52px] px-5 rounded-full border border-white/20 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px] tracking-[0.3em] text-center"
                  />
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="New Password"
                    required
                    className="w-full h-[52px] px-5 rounded-full border border-white/15 bg-[#0e1016] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 text-[15px]"
                  />
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-full bg-white text-black text-[15px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : (step === 1 ? 'Send Reset Code' : 'Reset Password')}
              </button>
            </form>

            <p className="mt-10 text-[15px] text-gray-500">
              Remembered your password?{' '}
              <Link to="/login" className="text-white font-medium hover:text-gray-300 transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </section>

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