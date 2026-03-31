import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Plus, BookOpen, Search, Users, Clock, AlertCircle, Loader, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function Classes() {
  const { user } = useAuthStore();
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [newClass, setNewClass] = useState({
    code: '',
    name: '',
    schedule: '',
    department: user?.department || '',
    capacity: 30,
    lecturer_id: user?.id || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'admin' || user?.role === 'department_head' ? '/admin/classes' : '/classes';
      const res = await fetchApi(endpoint);
      setClasses(res.data.classes);
      setFilteredClasses(res.data.classes);
    } catch (err: any) {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const create = params.get('create');
    const search = params.get('search');

    if (create === '1' || create === 'true') {
      setIsModalOpen(true);
    }

    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  // Filter classes based on search query
  useEffect(() => {
    const filtered = classes.filter(c =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClasses(filtered);
  }, [searchQuery, classes]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newClass.code.trim() || !newClass.name.trim() || !newClass.schedule.trim() || !newClass.department.trim()) {
      setError('Please fill in all required fields');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!Number.isFinite(newClass.capacity) || newClass.capacity <= 0) {
      setError('Please enter a valid capacity');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError('');

    setSubmitting(true);
    try {
      const payload = { ...newClass, capacity: Number(newClass.capacity) };

      if (editingClass && (user?.role === 'admin' || user?.role === 'department_head')) {
        await fetchApi(`/admin/classes/${editingClass.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/classes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      
      // Show success feedback
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingClass(null);
        setNewClass({
          code: '',
          name: '',
          schedule: '',
          department: user?.department || '',
          capacity: 30,
          lecturer_id: user?.id || ''
        });
        setError('');
        loadClasses();
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Failed to create class. Please try again.');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditClass = (c: any) => {
    setEditingClass(c);
    setNewClass({
      code: c.code,
      name: c.name,
      schedule: c.schedule || '',
      department: c.department || '',
      capacity: c.capacity || 30,
      lecturer_id: c.lecturer_id || user?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (c: any) => {
    try {
      await fetchApi(`/admin/classes/${c.id}`, { method: 'DELETE' });
      await loadClasses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage your classes and schedules.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'department_head' || user?.role === 'lecturer') && (
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
          >
            New Class
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            icon={<Search className="h-5 w-5" />}
            placeholder="Search classes by code, name, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30">
                <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Classes Found</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? 'No classes match your search. Try adjusting your query.' 
                : 'No classes available yet. Create your first class to get started.'}
            </p>
            {!searchQuery && (user?.role === 'admin' || user?.role === 'department_head' || user?.role === 'lecturer') && (
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="primary"
                className="mt-6 mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Class
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredClasses.map((c) => (
            <Card key={c.id} hoverable className="animate-fade-in">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30">
                          <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.code} - {c.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          Lecturer: {c.lecturer_name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{c.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Capacity: {c.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-xs font-semibold">
                          {c.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {(user?.role === 'admin' || user?.role === 'department_head') && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditClass(c)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClass(c)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-red-500 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Class Modal - Enhanced Design */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity duration-300 backdrop-blur-sm" 
              aria-hidden="true"
              onClick={() => !submitting && setIsModalOpen(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Card - Beautiful Design */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full hover:shadow-3xl dark:hover:shadow-2xl">
              
              {/* Modal Header with Gradient Background */}
              <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl leading-6 font-bold text-white" id="modal-title">
                      {editingClass ? 'Edit Class' : 'Create New Class'}
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">
                      {editingClass ? 'Update class details' : 'Add a new class to your schedule'}
                    </p>
                    <p className="text-indigo-100/90 text-xs mt-2">
                      Current role: {user?.role || 'unknown'}
                    </p>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => !submitting && setIsModalOpen(false)}
                  disabled={submitting}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form ref={formRef} onSubmit={handleCreateClass} className="px-6 py-6 sm:px-8 sm:py-8 flex flex-col max-h-[75vh]">
                {/* Error Alert */}
                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} className="space-y-5 flex-1 overflow-y-auto pr-1">
                  {/* Class Code */}
                  <Input
                    label="Class Code"
                    placeholder="e.g., CS101"
                    value={newClass.code}
                    onChange={e => setNewClass({...newClass, code: e.target.value})}
                    helperText="Unique identifier for your class"
                    required
                  />

                  {/* Class Name */}
                  <Input
                    label="Class Name"
                    placeholder="e.g., Introduction to Programming"
                    value={newClass.name}
                    onChange={e => setNewClass({...newClass, name: e.target.value})}
                    helperText="Full name of the class"
                    required
                  />

                  {/* Department */}
                  <Input
                    label="Department"
                    placeholder="e.g., Computer Science"
                    value={newClass.department}
                    onChange={e => setNewClass({...newClass, department: e.target.value})}
                    helperText="Department offering this class"
                    required
                  />

                  {/* Schedule */}
                  <Input
                    label="Schedule"
                    placeholder="e.g., Mon 10:00-12:00, Wed 14:00-16:00"
                    value={newClass.schedule}
                    onChange={e => setNewClass({...newClass, schedule: e.target.value})}
                    helperText="Class meeting times"
                    required
                  />

                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Capacity</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="e.g., 30"
                          value={newClass.capacity}
                          onChange={e => setNewClass({...newClass, capacity: parseInt(e.target.value)})}
                          required
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg whitespace-nowrap">students</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Maximum number of students</p>
                  </div>

                  {/* Lecturer ID - Admin/Dept Head */}
                  {(user?.role === 'admin' || user?.role === 'department_head') && (
                    <Input
                      label="Lecturer ID"
                      placeholder="Enter lecturer ID"
                      value={newClass.lecturer_id}
                      onChange={e => setNewClass({...newClass, lecturer_id: e.target.value})}
                      helperText="Assign this class to a lecturer"
                      required
                    />
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 -mx-6 sm:-mx-8 px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
                  {error ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mr-3">{error}</p>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (!submitting) {
                          setIsModalOpen(false);
                          setEditingClass(null);
                          setError('');
                        }
                      }}
                      disabled={submitting}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting || !newClass.code || !newClass.name || !newClass.department || !newClass.schedule}
                    >
                      {submitting ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          {editingClass ? 'Saving...' : 'Creating Class...'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {editingClass ? 'Save Changes' : 'Create Class'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
