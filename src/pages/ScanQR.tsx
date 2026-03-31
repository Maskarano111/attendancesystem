import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { fetchApi } from '../lib/api';
import { CheckCircle, XCircle, Loader, User, Hash, Mail } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function ScanQR() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_name: '',
    student_index_number: '',
    student_email: ''
  });

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanResult(decodedText);
        setScanning(false);
        setShowForm(true);
        setError(null);
        setFormData({ student_name: '', student_index_number: '', student_email: '' });
      },
      (err) => {
        // Ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scanning]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.student_name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.student_index_number.trim()) {
      setError('Please enter your index number');
      return;
    }
    if (!formData.student_email.trim()) {
      setError('Please enter your institutional email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ 
          qr_data: scanResult,
          student_name: formData.student_name,
          student_index_number: formData.student_index_number,
          student_email: formData.student_email
        }),
      });
      setSuccess(res.message);
      setShowForm(false);
      
      // Auto-restart after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setSuccess(null);
        setScanning(true);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setScanResult(null);
    setShowForm(false);
    setFormData({ student_name: '', student_index_number: '', student_email: '' });
    setError(null);
    setScanning(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan QR Code</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {showForm ? 'Please verify your information' : 'Position the QR code within the frame to mark your attendance.'}
        </p>
      </div>

      {/* Scanner Card - Only show when scanning */}
      {!showForm && (
        <Card className="animate-fade-in">
          <CardBody>
            <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
            
            {scanning && (
              <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Waiting for QR code...</span>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Verification Form - Show after QR is scanned */}
      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verify Your Information</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {error && (
                <Alert type="error" onClose={() => setError(null)}>
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p>{error}</p>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    name="student_name"
                    value={formData.student_name}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Index Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Index Number *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    name="student_index_number"
                    value={formData.student_index_number}
                    onChange={handleFormChange}
                    placeholder="Enter your index number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Institutional Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    name="student_email"
                    value={formData.student_email}
                    onChange={handleFormChange}
                    placeholder="Enter your institutional email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Marking...
                    </>
                  ) : (
                    'Mark Attendance'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Success Alert */}
      {success && (
        <Alert type="success" onClose={() => setSuccess(null)}>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Attendance Marked!</h3>
              <p className="mt-1">{success}</p>
              <p className="text-xs mt-2 opacity-75">Restarting scanner in 3 seconds...</p>
            </div>
          </div>
        </Alert>
      )}

      {/* Info Card */}
      {!showForm && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardBody className="space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Tips for scanning</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>• Ensure good lighting for best results</li>
              <li>• Hold the QR code at a 90-degree angle</li>
              <li>• Keep the QR code within the frame</li>
              <li>• Stay still while scanning</li>
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
