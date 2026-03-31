import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { QrCode, Calendar, Clock, Download, Check, AlertCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';

export default function GenerateQR() {
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchApi('/classes');
        const loadedClasses = res.data.classes || [];
        setClasses(loadedClasses);

        if (preselectedClassId && loadedClasses.some((c: any) => c.id === preselectedClassId)) {
          setSelectedClass(preselectedClassId);
        } else if (loadedClasses.length > 0) {
          setSelectedClass(loadedClasses[0].id);
        }
      } catch (err: any) {
        setError('Failed to load classes');
      }
    };
    loadClasses();
  }, [preselectedClassId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }
    
    if (!date) {
      setError('Please select a date');
      return;
    }
    
    if (!startTime) {
      setError('Please select a start time');
      return;
    }
    
    if (!endTime) {
      setError('Please select an end time');
      return;
    }
    
    // Validate time range
    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Cannot create session for a past date');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const res = await fetchApi('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({
          class_id: selectedClass,
          date,
          start_time: startTime,
          end_time: endTime,
        }),
      });
      setQrCodeImage(res.data.qr_code_image);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeImage) return;
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr-code-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate QR Code</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new attendance session for your class.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="animate-fade-in">
            <CardBody>
              <form onSubmit={handleGenerate} className="space-y-6">
                {error && (
                  <Alert type="error" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Class
                  </label>
                  <select
                    required
                    className="input-field"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={classes.length === 0}
                  >
                    <option value="">{classes.length === 0 ? 'No classes assigned' : 'Select a class'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      You don’t have any classes assigned yet. Create a class first.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    icon={<Calendar className="h-5 w-5" />}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />

                  <Input
                    label="Start Time"
                    type="time"
                    icon={<Clock className="h-5 w-5" />}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />

                  <Input
                    label="End Time"
                    type="time"
                    icon={<Clock className="h-5 w-5" />}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading || classes.length === 0 || !selectedClass}
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-5 w-5 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Info Card */}
        <div>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 h-full">
            <CardHeader>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">How it works</h3>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-indigo-800 dark:text-indigo-300">
              <p className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">1.</span>
                <span>Select your class and attendance time</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">2.</span>
                <span>Click "Generate QR Code"</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">3.</span>
                <span>Display it on your screen or print it</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold flex-shrink-0">4.</span>
                <span>Students scan to mark attendance</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* QR Code Display */}
      {qrCodeImage && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                Your QR Code
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex justify-center">
              <div className="bg-white p-8 rounded-lg border-2 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <img src={qrCodeImage} alt="QR Code" className="w-96 h-96" />
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Info:</strong> This QR code is valid for the selected time slot on {new Date(date).toLocaleDateString()} from {startTime} to {endTime}. Students can scan it to mark their attendance.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
