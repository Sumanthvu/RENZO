import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login triggered!");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.1)] transform transition-all duration-500 hover:shadow-[0_0_60px_rgba(139,92,246,0.15)] hover:-translate-y-2">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Log in to SparkShell to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(147,51,234,0.4)]"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
            Create one
          </Link>
        </div>

      </div>
    </div>
  );
}