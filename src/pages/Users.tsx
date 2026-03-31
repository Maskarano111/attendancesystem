import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Users as UsersIcon, Mail, Briefcase, Search, Plus, Edit, UserX, KeyRound } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'student',
    department: '',
    password: ''
  });
  const [actionMessage, setActionMessage] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetchApi('/admin/users');
      setUsers(res.data.users);
      setFilteredUsers(res.data.users);
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search query
  useEffect(() => {
    const filtered = users.filter(u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      lecturer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      department_head: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', role: 'student', department: '', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormData({
      username: u.username || '',
      email: u.email || '',
      role: u.role || 'student',
      department: u.department || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setError('');
      setActionMessage('');
      if (editingUser) {
        const payload: any = {};
        if (formData.username !== editingUser.username) payload.username = formData.username;
        if (formData.email !== editingUser.email) payload.email = formData.email;
        if (formData.role !== editingUser.role) payload.role = formData.role;
        if ((formData.department || '') !== (editingUser.department || '')) {
          payload.department = formData.department;
        }

        if (Object.keys(payload).length === 0) {
          setError('No changes to save.');
          return;
        }

        await fetchApi(`/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setActionMessage('User updated successfully');
      } else {
        await fetchApi('/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            ...(formData.department ? { department: formData.department } : {})
          })
        });
        setActionMessage('User created successfully');
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (u: any) => {
    try {
      const isActive = u.is_active !== 0;
      await fetchApi(`/admin/users/${u.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive ? 0 : 1 })
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (u: any) => {
    try {
      const res = await fetchApi(`/admin/users/${u.id}/reset-password`, { method: 'POST' });
      setActionMessage(`Temporary password for ${u.username}: ${res.data.tempPassword}`);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage system users and their roles. Total: {users.length} users
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-5 w-5" />} onClick={openCreateModal}>
          New User
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {actionMessage && (
        <Alert type="success" onClose={() => setActionMessage('')}>
          {actionMessage}
        </Alert>
      )}

      {/* Search Bar */}
      <Input
        icon={<Search className="h-5 w-5" />}
        placeholder="Search users by name, email, role, or department..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Users List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30">
                <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Users Found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? 'No users match your search. Try adjusting your query.' 
                : 'No users to display.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} hoverable className="animate-fade-in">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center">
                        <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {u.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Metadata */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadgeColor(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.is_active !== 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                      {u.is_active !== 0 ? 'Active' : 'Disabled'}
                    </span>
                    {u.department && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Briefcase className="h-3 w-3" />
                        <span>{u.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditModal(u)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <UserX className="h-4 w-4" />
                    {u.is_active !== 0 ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleResetPassword(u)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset Password
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>
            <div className="space-y-4">
              <Input label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              {!editingUser && (
                <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="department_head">Department Head</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <Input label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveUser}>{editingUser ? 'Save Changes' : 'Create User'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
