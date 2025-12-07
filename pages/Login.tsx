
import React, { useState } from 'react';
import { HardHat, Eye, EyeOff, Lock, Mail, ArrowRight, X } from 'lucide-react';
import { dataService } from '../services/store';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Temp Password Change State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const result = dataService.login(email, password);
      
      if (result.success && result.user) {
        if (result.user.isTempPassword) {
          setTempUser(result.user);
          setShowChangePassword(true);
          setLoading(false);
        } else {
          onLogin(result.user);
        }
      } else {
        setError(result.error || 'Invalid credentials');
        setLoading(false);
      }
    }, 800);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (tempUser) {
      dataService.changePassword(tempUser.id, newPassword);
      onLogin({ ...tempUser, isTempPassword: false });
    }
  };

  const demoAccounts = [
    { role: 'Supervisor', email: 'alex@lightspeed.com', pass: 'password' },
    { role: 'Crew Lead', email: 'sarah@lightspeed.com', pass: 'password' },
    { role: 'Manager', email: 'mike@lightspeed.com', pass: 'password' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <HardHat size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">CrewConnect</h1>
          <p className="text-slate-400 text-sm">Field Operations Platform</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex items-center justify-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Demo Helpers */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-500 mb-3 uppercase tracking-wider font-semibold">Demo Accounts</p>
            <div className="space-y-2">
              {demoAccounts.map(account => (
                <button
                  key={account.email}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.pass);
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-xs text-slate-600 flex justify-between items-center group transition-colors"
                >
                  <span className="font-medium group-hover:text-blue-600">{account.role}</span>
                  <span className="text-slate-400 group-hover:text-slate-600">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Force Password Change Modal */}
        {showChangePassword && (
          <div className="absolute inset-0 bg-white z-50 p-8 flex flex-col justify-center animate-fade-in">
             <div className="mb-6 text-center">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Lock size={32} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
               <p className="text-slate-500 mt-2">Please update your temporary password to continue.</p>
             </div>
             
             <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="New password"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Confirm new password"
                  />
               </div>

               {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg text-center">
                  {error}
                </div>
               )}

               <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm mt-2"
                >
                  Update & Sign In
                </button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
