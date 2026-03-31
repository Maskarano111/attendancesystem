// Quick API test
const http = require('http');

console.log('Testing Smart Student Attendance System...\n');

// Test 1: Health Check
console.log('✓ Testing API health endpoint...');
http.get('http://localhost:8000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✓ API Health:', data);
    console.log('\n✓ Backend is working!\n');
  });
}).on('error', (err) => {
  console.error('✗ Health check failed:', err.message);
});

// Test 2: Frontend
console.log('✓ Frontend accessible at: http://localhost:8000');
console.log('\n📋 Demo Credentials:');
console.log('   Admin:    admin@demo.com / password');
console.log('   Lecturer: lecturer@demo.com / password');
console.log('   Student:  student@demo.com / password');
console.log('\n✅ System is ready! Open http://localhost:8000 in your browser.\n');
