import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { fetchApi } from '../lib/api';
import { BookOpen, Users, LogIn, Clock, TrendingUp, Award, BarChart3, AlertCircle, Eye, Settings, ShieldCheck, FileText, UserPlus } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Alert } from '../components/ui/Alert';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleViewSession = (sessionId: string, sessionName: string) => {
    // Navigate to session details
    window.location.href = `/reports?session=${sessionId}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        if (user?.role === 'admin' || user?.role === 'department_head') {
          const res = await fetchApi('/admin/reports');
          setStats(res.data);
          const auditRes = await fetchApi('/admin/audit');
          setAuditLogs(auditRes?.data?.logs || []);
          const sessionsRes = await fetchApi('/admin/sessions');
          setSessions(sessionsRes?.data?.sessions || []);
        } else {
          const res = await fetchApi('/attendance/records');
          setRecentRecords(res.data.records.slice(0, 5));
        }
      } catch (error: any) {
        console.error(error);
        setError(error.message || 'Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const getAttendancePercentage = () => {
    if (!stats?.attendanceStats || stats.attendanceStats.length === 0) return 0;
    const total = stats.attendanceStats.reduce((sum: number, s: any) => sum + s.attendance_count, 0);
    return Math.round((total / (stats.attendanceStats.length * 30)) * 100) || 0;
  };

  const StatCard = ({ icon: Icon, label, value, trend }: any) => (
    <Card hoverable className="animate-fade-in">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30">
              <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.username}!</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {user?.role === 'admin' || user?.role === 'department_head'
              ? "Here's an overview of your system's attendance."
              : "Here's your attendance dashboard for today."}
          </p>
        </div>
      </div>

      {/* Admin/Department Head Dashboard */}
      {(user?.role === 'admin' || user?.role === 'department_head') && stats && (
        <>
          {/* Admin Quick Actions */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card hoverable className="animate-fade-in">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Manage Users</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create, disable, reset</p>
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/users')}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  Go to Users
                </button>
              </CardBody>
            </Card>
            <Card hoverable className="animate-fade-in">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Manage Classes</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Edit and assign</p>
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/classes')}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  Go to Classes
                </button>
              </CardBody>
            </Card>
            <Card hoverable className="animate-fade-in">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reports</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Export & analytics</p>
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/reports')}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  View Reports
                </button>
              </CardBody>
            </Card>
            <Card hoverable className="animate-fade-in">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Settings</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Policies & term dates</p>
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/reports')}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  Configure
                </button>
              </CardBody>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              icon={Users} 
              label="Total Users" 
              value={stats.totalUsers}
              trend="+12% from last month"
            />
            <StatCard 
              icon={BookOpen} 
              label="Active Classes" 
              value={stats.attendanceStats?.length || 0}
              trend={`${stats.totalUsers} enrolled`}
            />
            <StatCard 
              icon={LogIn} 
              label="Today's Attendance" 
              value={stats.attendanceStats?.reduce((sum: number, s: any) => sum + s.attendance_count, 0) || 0}
              trend="Records marked"
            />
            <StatCard 
              icon={Award} 
              label="Avg. Attendance Rate" 
              value={`${getAttendancePercentage()}%`}
              trend="System-wide"
            />
          </div>

          {/* Detailed Stats */}
          {stats.attendanceStats && stats.attendanceStats.length > 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Attendance by Class
                </h3>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Attendances</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {stats.attendanceStats.map((s: any) => (
                        <tr key={s.class_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{s.class_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{s.attendance_count} students</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              s.attendance_count > 20
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {s.attendance_count > 20 ? 'Good' : 'Moderate'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Sessions */}
          <Card className="animate-fade-in">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Recent Sessions
              </h3>
            </CardHeader>
            <CardBody>
              {stats.attendanceStats && stats.attendanceStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {stats.attendanceStats.slice(0, 5).map((s: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{s.class_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">10:00 AM - 12:00 PM</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleViewSession(s.class_id, s.class_name)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sessions yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sessions will appear here as they are created.</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Admin Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Recent Admin Activity
                </h3>
              </CardHeader>
              <CardBody>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.slice(0, 6).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{log.username} • {log.entity_type}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Active Sessions
                </h3>
              </CardHeader>
              <CardBody>
                {sessions.filter((s: any) => s.status === 'active').length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No active sessions.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.filter((s: any) => s.status === 'active').slice(0, 6).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{s.class_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{s.date} • {s.start_time}-{s.end_time}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Student/Lecturer Dashboard */}
      {(user?.role === 'student' || user?.role === 'lecturer') && (
        <Card className="animate-fade-in">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Recent Attendance
            </h3>
          </CardHeader>
          <CardBody>
            {recentRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {recentRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{record.class_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(record.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No attendance records</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You haven't marked any attendance yet.</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
