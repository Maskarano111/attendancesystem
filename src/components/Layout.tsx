import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { 
  LayoutDashboard, 
  QrCode, 
  ScanLine, 
  Users, 
  BookOpen, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Clock,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['student', 'lecturer', 'admin', 'department_head'] },
    { name: 'Lecturer', path: '/lecturer', icon: BookOpen, roles: ['lecturer'] },
    { name: 'Scan QR', path: '/scan', icon: ScanLine, roles: ['student'] },
    { name: 'Generate QR', path: '/generate-qr', icon: QrCode, roles: ['lecturer', 'admin'] },
    { name: 'Classes', path: '/classes', icon: BookOpen, roles: ['lecturer', 'admin', 'department_head'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['admin', 'department_head'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['lecturer', 'admin', 'department_head'] },
    { name: 'Session Control', path: '/reports', search: '?view=sessions', icon: Clock, roles: ['admin', 'department_head'] },
    { name: 'Audit Log', path: '/reports', search: '?view=audit', icon: ShieldCheck, roles: ['admin', 'department_head'] },
    { name: 'System Settings', path: '/reports', search: '?view=settings', icon: Settings, roles: ['admin', 'department_head'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SmartAttend</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path && (item.search ? location.search === item.search : true);
                return (
                  <Link
                    key={item.name}
                    to={`${item.path}${item.search ?? ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "mr-3 flex-shrink-0 h-5 w-5",
                      isActive ? "text-indigo-600 dark:text-indigo-300" : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.username}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm md:hidden">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SmartAttend</span>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
