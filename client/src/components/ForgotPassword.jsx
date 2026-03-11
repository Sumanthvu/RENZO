import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl shadow-[0_0_40px_rgba(236,72,153,0.1)] transform transition-all duration-500 hover:shadow-[0_0_60px_rgba(236,72,153,0.15)] hover:-translate-y-2">
        
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-gray-400 hover:text-pink-400 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Login
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">
            {step === 1 ? 'Enter your email to receive a reset code.' : 'Enter the code and your new password.'}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleRequestResetOtp : handleResetPassword} className="space-y-5">
          {step === 1 ? (
            /* Email Field */
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-500 transition-colors" size={20} />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address" 
                required
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
          ) : (
            <>
              /* OTP Field */
              <div className="relative group animate-pulse">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP" 
                  required
                  className="w-full bg-gray-950 border border-pink-500 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all tracking-widest text-center"
                />
              </div>

              /* New Password Field */
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="New Password" 
                  required
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-pink-800 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
          >
            {loading ? 'Processing...' : (step === 1 ? 'Send Reset Code' : 'Reset Password')}
          </button>
        </form>

      </div>
    </div>
  );
}