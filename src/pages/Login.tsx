import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { fetchApi } from '../lib/api';
import { QrCode, Lock, Mail, User, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Card, CardBody } from '../components/ui/Card';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth, user, token } = useAuthStore();

  React.useEffect(() => {
    if (token && user) {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const handleTabClick = (mode: boolean) => {
    setIsLogin(mode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email, password }
        : { email, password, username, role, department };

      const response = await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!isLogin) {
        setSuccess('Account created successfully! Logging in...');
        setTimeout(() => {
          setAuth(response.data.user, response.token, response.refreshToken);
          navigate('/dashboard');
        }, 1500);
      } else {
        setAuth(response.data.user, response.token, response.refreshToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'department_head', label: 'Department Head' },
    { value: 'admin', label: 'Administrator' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <QrCode className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900 dark:text-white">SmartAttend</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Intelligent Attendance System</p>
        </div>

        <Card>
          <CardBody>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => handleTabClick(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                  isLogin
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleTabClick(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <Input
                    label="Username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="input-field"
                    >
                      {roles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Department (Optional)"
                    placeholder="e.g., Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </>
              )}
              
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-6"
                loading={loading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </CardBody>
        </Card>

        {isLogin && (
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
            <CardBody className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                <CheckCircle className="h-4 w-4" />
                Demo Credentials
              </div>
              <p className="text-indigo-600 dark:text-indigo-400"><strong>Student:</strong> student@demo.com / password</p>
              <p className="text-indigo-600 dark:text-indigo-400"><strong>Lecturer:</strong> lecturer@demo.com / password</p>
              <p className="text-indigo-600 dark:text-indigo-400"><strong>Admin:</strong> admin@demo.com / password</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
