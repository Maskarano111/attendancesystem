import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchApi } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useLocation, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, TrendingUp, Loader, CheckCircle, XCircle, Calendar, Award, Target, Clock, AlertCircle, Zap, GraduationCap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { CardSkeleton } from '../components/ui/Skeleton';

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#06B6D4'];

export default function Reports() {
  const { user } = useAuthStore();
  const location = useLocation();
  const settingsRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const sessionsRef = useRef<HTMLDivElement>(null);
  const view = useMemo(() => new URLSearchParams(location.search).get('view'), [location.search]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    term_start: '',
    term_end: '',
    qr_expiry_minutes: 10,
    attendance_rules: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const activeView = view || 'overview';
  const canAdmin = user?.role === 'admin' || user?.role === 'department_head';
  const showOverview = activeView === 'overview';
  const showSessions = activeView === 'sessions' && canAdmin;
  const showAudit = activeView === 'audit' && canAdmin;
  const showSettings = activeView === 'settings' && canAdmin;

  useEffect(() => {
    const loadReports = async () => {
      try {
        if (user?.role === 'admin' || user?.role === 'department_head') {
          const res = await fetchApi('/admin/reports');
          setStats(res.data);

          const auditRes = await fetchApi('/admin/audit');
          setAuditLogs(auditRes.data.logs || []);

          const sessionsRes = await fetchApi('/admin/sessions');
          setSessions(sessionsRes.data.sessions || []);

          const settingsRes = await fetchApi('/admin/settings');
          setSettings({
            term_start: settingsRes.data.settings?.term_start || '',
            term_end: settingsRes.data.settings?.term_end || '',
            qr_expiry_minutes: settingsRes.data.settings?.qr_expiry_minutes || 10,
            attendance_rules: settingsRes.data.settings?.attendance_rules || ''
          });
        } else {
          const recordsRes = await fetchApi('/attendance/records');
          const records = recordsRes.data?.records || [];
          setAttendanceRecords(records);

          const sessionsRes = await fetchApi('/attendance/sessions');
          setSessions(sessionsRes.data?.sessions || []);

          const attendanceStats = buildAttendanceStats(records);
          setStats({ attendanceStats });
        }

        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load reports. Please try again later.');
        setStats({ attendanceStats: [] });
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [user]);

  const buildAttendanceStats = (records: any[]) => {
    const map = new Map<string, number>();
    records.forEach((r: any) => {
      const key = r.class_name || 'Unknown Class';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([class_name, attendance_count]) => ({
      class_name,
      attendance_count,
    }));
  };

  useEffect(() => {
    if (view === 'settings') settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (view === 'audit') auditRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (view === 'sessions') sessionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [view]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await fetchApi('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    await fetchApi(`/admin/sessions/${sessionId}/close`, { method: 'PATCH' });
    const sessionsRes = await fetchApi('/admin/sessions');
    setSessions(sessionsRes.data.sessions || []);
  };

  const handleExport = async () => {
    if (!stats || !stats.attendanceStats) return;
    
    setExporting(true);
    try {
      const headers = ['Class Name', 'Attendance Count', 'Percentage'];
      const totalExpected = stats.attendanceStats.length * 30;
      const rows = stats.attendanceStats.map((s: any) => [
        s.class_name,
        s.attendance_count,
        `${((s.attendance_count / (totalExpected || 1)) * 100).toFixed(2)}%`
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  const calculateStats = () => {
    if (!stats?.attendanceStats || stats.attendanceStats.length === 0) {
      return { total: 0, average: 0, highest: 0, lowest: 0 };
    }

    const counts = stats.attendanceStats.map((s: any) => s.attendance_count);
    const total = counts.reduce((sum: number, count: number) => sum + count, 0);
    
    return {
      total,
      average: Math.round(total / counts.length),
      highest: Math.max(...counts),
      lowest: Math.min(...counts),
    };
  };

  const statsData = calculateStats();
  const recentRecords = attendanceRecords.slice(0, 8);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const getOverallAttendancePercentage = () => {
    if (!stats?.attendanceStats || stats.attendanceStats.length === 0) return 0;
    const total = stats.attendanceStats.reduce((sum: number, s: any) => sum + s.attendance_count, 0);
    const expectedClasses = Math.max(1, stats.attendanceStats.reduce((sum: number, s: any) => sum + 1, 0) * 15);
    return Math.round((total / expectedClasses) * 100);
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', bgColor: 'bg-green-600' };
    if (percentage >= 75) return { label: 'Good', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', bgColor: 'bg-blue-600' };
    if (percentage >= 60) return { label: 'Fair', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', bgColor: 'bg-yellow-600' };
    return { label: 'Needs Improvement', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', bgColor: 'bg-red-600' };
  };

  const overallPercentage = getOverallAttendancePercentage();
  const attendanceStatus = getAttendanceStatus(overallPercentage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Attendance Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
            {canAdmin ? 'View system reports and statistics.' : `Welcome! Here's your attendance overview.`}
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || !stats || !stats.attendanceStats || stats.attendanceStats.length === 0}
          variant="primary"
          icon={exporting ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Tabs - Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link
          to="/reports?view=overview"
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition flex items-center gap-2 ${
            activeView === 'overview'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Zap className="h-4 w-4" />
          Overview
        </Link>
        {canAdmin && (
          <>
            <Link
              to="/reports?view=sessions"
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeView === 'sessions'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Session Control
            </Link>
            <Link
              to="/reports?view=audit"
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeView === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              Audit Log
            </Link>
            <Link
              to="/reports?view=settings"
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition flex items-center gap-2 ${
                activeView === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Settings
            </Link>
          </>
        )}
      </div>

      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Grid - Student View Enhanced */}
      {showOverview && !canAdmin && (
        <div className="space-y-6">
          {/* Main Attendance Card */}
          <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
            <CardBody className="text-white">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">Overall Attendance</p>
                  <div className="flex items-end gap-3 mt-2">
                    <h2 className="text-6xl font-bold">{overallPercentage}%</h2>
                    <p className={`text-sm font-bold px-3 py-1 rounded-full ${attendanceStatus.color}`}>
                      {attendanceStatus.label}
                    </p>
                  </div>
                </div>
                <div className="text-6xl opacity-20">🎓</div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${attendanceStatus.bgColor}`}
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm mt-2 text-indigo-100">Keep it up! You're doing great.</p>
              </div>
            </CardBody>
          </Card>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Attendances */}
            <Card hoverable className="transform hover:scale-105 transition-transform">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attendances</p>
                    <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-3">{statsData.total}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Classes attended</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30">
                      <CheckCircle className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Average per Class */}
            <Card hoverable className="transform hover:scale-105 transition-transform">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average per Class</p>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-3">{statsData.average}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Classes per subject</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30">
                      <Target className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Best Attendance */}
            <Card hoverable className="transform hover:scale-105 transition-transform">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Attendance</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">{statsData.highest}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Highest streak</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/30">
                      <Award className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Classes to Improve */}
            <Card hoverable className="transform hover:scale-105 transition-transform">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Focus Area</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mt-3">{statsData.lowest}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Lowest subject</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/30">
                      <AlertCircle className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Stats Grid - Admin View */}
      {showOverview && canAdmin && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable className="animate-fade-in">
          <CardBody>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attendances</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{statsData.total}</p>
          </CardBody>
        </Card>
        <Card hoverable className="animate-fade-in">
          <CardBody>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average per Class</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{statsData.average}</p>
          </CardBody>
        </Card>
        <Card hoverable className="animate-fade-in">
          <CardBody>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest Attendance</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{statsData.highest}</p>
          </CardBody>
        </Card>
        <Card hoverable className="animate-fade-in">
          <CardBody>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lowest Attendance</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{statsData.lowest}</p>
          </CardBody>
        </Card>
      </div>
      )}

      {/* Charts */}
      {showOverview && (
        stats && stats.attendanceStats && stats.attendanceStats.length > 0 ? (
          <div className={`grid gap-6 ${!canAdmin ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {/* Bar Chart */}
            <Card className={`animate-fade-in ${!canAdmin ? 'lg:col-span-2' : ''}`}>
              <CardHeader>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Attendance by Subject
                </h3>
              </CardHeader>
              <CardBody>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.attendanceStats}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                      <XAxis 
                        dataKey="class_name" 
                        stroke="#6B7280"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          borderColor: '#374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                        itemStyle={{ color: '#818CF8' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="attendance_count" 
                        name="Classes Attended" 
                        fill="#4F46E5" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Pie Chart */}
            <Card className="animate-fade-in">
              <CardHeader>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Subject Distribution
                </h3>
              </CardHeader>
              <CardBody>
                <div className="h-96 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.attendanceStats}
                        dataKey="attendance_count"
                        nameKey="class_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.attendanceStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          borderColor: '#374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Data Available</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Charts will appear here once you have attendance records. Start scanning QR codes to mark attendance!
              </p>
            </CardBody>
          </Card>
        )
      )}

      {/* Class Details Table - Enhanced */}
      {showOverview && stats && stats.attendanceStats && stats.attendanceStats.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Subject Attendance Breakdown
            </h3>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                      Attended
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                      Percentage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {stats.attendanceStats.map((s: any, index: number) => {
                    const percentage = ((s.attendance_count / (stats.attendanceStats.length * 30)) * 100).toFixed(1);
                    const status = parseFloat(percentage) > 70 ? 'Excellent' : parseFloat(percentage) > 50 ? 'Good' : 'Needs Improvement';
                    const statusColor = status === 'Excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                       status === 'Good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                       'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
                    const progressColor = parseFloat(percentage) > 70 ? 'bg-green-500' : parseFloat(percentage) > 50 ? 'bg-blue-500' : 'bg-orange-500';

                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                              </div>
                            </div>
                            {s.class_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {s.attendance_count} classes
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-bold">
                          {percentage}%
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8">{percentage}% </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Attendance Records - Student View */}
      {showOverview && !canAdmin && recentRecords.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Recent Attendance Records
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {recentRecords.map((record: any, index: number) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {record.class_name || 'Class'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {record.session_date ? new Date(record.session_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Present
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty State for Recent Records */}
      {showOverview && !canAdmin && recentRecords.length === 0 && (
        <Card className="animate-fade-in">
          <CardBody className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Attendance Records Yet</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Your attendance records will appear here once you're marked present in a class.
            </p>
          </CardBody>
        </Card>
      )}

      {showSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Settings */}
          <Card ref={settingsRef} className="animate-fade-in">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term Start</label>
                    <input
                      type="date"
                      value={settings.term_start}
                      onChange={(e) => setSettings({ ...settings, term_start: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term End</label>
                    <input
                      type="date"
                      value={settings.term_end}
                      onChange={(e) => setSettings({ ...settings, term_end: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Expiry (minutes)</label>
                  <input
                    type="number"
                    value={settings.qr_expiry_minutes}
                    onChange={(e) => setSettings({ ...settings, qr_expiry_minutes: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendance Rules</label>
                  <textarea
                    value={settings.attendance_rules}
                    onChange={(e) => setSettings({ ...settings, attendance_rules: e.target.value })}
                    className="input-field min-h-[120px]"
                  />
                </div>
                <Button variant="primary" onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardBody>
          </Card>

        </div>
      )}

      {showAudit && (
        <Card ref={auditRef} className="animate-fade-in">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h3>
          </CardHeader>
          <CardBody>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No audit logs available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Action</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Entity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{log.username}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{log.action}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{log.entity_type}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {showSessions && (
        <Card ref={sessionsRef} className="animate-fade-in">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Control</h3>
          </CardHeader>
          <CardBody>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No sessions available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Class</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {sessions.map((s: any) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{s.class_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{s.date}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{s.start_time} - {s.end_time}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {s.status === 'active' && (
                            <button
                              onClick={() => handleCloseSession(s.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm border border-red-500 text-red-600 rounded-lg hover:bg-red-50"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
