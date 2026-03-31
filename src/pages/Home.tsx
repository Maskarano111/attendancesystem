import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { QrCode, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Home() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (token && user) {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SmartAttend</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
              <Button variant="primary" onClick={() => navigate('/login')}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto text-center mt-32">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">✨ Smart Attendance System</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Attendance Made <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Effortless</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Smart QR code-based attendance system. Mark attendance in seconds, analyze trends instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="primary" 
            onClick={() => navigate('/login')}
            className="h-14 text-base px-8"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Sign In
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/login')}
            className="h-14 text-base px-8"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Create Account
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400">Mark attendance in seconds with QR codes</p>
          </div>
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">Analyze attendance patterns in real-time</p>
          </div>
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">Enterprise-grade security for your data</p>
          </div>
        </div>
      </div>
    </div>
  );
}