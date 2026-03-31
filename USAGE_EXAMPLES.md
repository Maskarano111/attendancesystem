# Usage Examples & Workflows

## Complete Workflow Guide

---

## 📋 Workflow 1: Setting Up a New Class (Lecturer)

### Step 1: Login as Lecturer
```
Email: lecturer@demo.com
Password: password
```

### Step 2: Navigate to Classes
- Click "Classes" in sidebar
- Or use the quick action from Lecturer Dashboard

### Step 3: Create a New Class
1. Click "Create Class" button
2. Fill in the form:
   - **Class Code**: CS101
   - **Class Name**: Introduction to Programming
   - **Schedule**: Mon 10:00-12:00, Wed 14:00-16:00
   - **Department**: Computer Science
   - **Capacity**: 50
3. Click "Create Class"
4. See success message and class appears in list

### Step 4: View Your Classes
- Classes appear in grid layout
- Each card shows code, name, schedule
- Search by code or name if needed
- Click on class for more details

---

## 📱 Workflow 2: Creating Attendance Session (Lecturer)

### Step 1: Navigate to Generate QR Code
- Click "Generate QR Code" in sidebar
- Or use quick action from Lecturer Dashboard

### Step 2: Create New Session
1. Select class from dropdown
2. Choose date (must be today or future)
3. Set start time (e.g., 10:00)
4. Set end time (e.g., 12:00)
   - **Note**: End time must be after start time
5. Click "Generate QR Code"
6. See loading spinner then QR code appears

### Step 3: Use the QR Code
- **Option A**: Display on screen for students to scan
- **Option B**: Download QR code to print or share
  - Click "Download QR Code"
  - Save with meaningful name

### Step 4: Monitor Attendance
- Students scan the QR code
- Each scan marks attendance automatically
- View real-time marks in Reports page

---

## ✅ Workflow 3: Marking Attendance (Student)

### Step 1: Login as Student
```
Email: student@demo.com
Password: password
```

### Step 2: Navigate to Scan QR Code
- Click "Scan QR Code" in sidebar
- Or direct navigation from dashboard

### Step 3: Scan QR Code
1. Allow camera access when prompted
2. Position QR code within frame
3. Keep steady for scanner to detect
4. See "Scanning..." indicator

### Step 4: Confirmation
1. Successful scan shows green checkmark
2. Success message: "Attendance Marked!"
3. Scanner automatically restarts
4. Can scan multiple sessions in sequence

### Step 5: Check History
1. Go to Dashboard
2. View "Recent Attendance" table
3. See all marked attendance with timestamps

---

## 📊 Workflow 4: Viewing Reports (Admin/Lecturer)

### Step 1: Login as Admin or Lecturer
```
Admin: admin@demo.com
Lecturer: lecturer@demo.com
```

### Step 2: Navigate to Reports
- Click "Reports" in sidebar
- View comprehensive analytics

### Step 3: View Statistics
- **Total Attendances**: Sum of all attendance marks
- **Average per Class**: Mean attendance
- **Highest Attendance**: Best performing class
- **Lowest Attendance**: Needs attention

### Step 4: Analyze Charts
- **Bar Chart**: Attendance by class (visual trend)
- **Pie Chart**: Distribution across classes

### Step 5: Export Data
1. Click "Export CSV" button
2. Wait for export to complete (shows "Exporting...")
3. CSV file downloads automatically
4. Contains:
   - Class Name
   - Attendance Count
   - Percentage

---

## 👥 Workflow 5: Managing Users (Admin)

### Step 1: Login as Admin
```
Email: admin@demo.com
Password: password
```

### Step 2: Navigate to Users
- Click "Users" in sidebar
- See all system users

### Step 3: Search Users
- Use search box at top
- Filter by:
  - Username (e.g., "admin")
  - Email (e.g., "@demo.com")
  - Role (e.g., "lecturer")
  - Department (e.g., "Computer Science")

### Step 4: View User Details
- See avatar with user initial
- User name and email
- Assigned role (badge with color)
- Department if applicable

### Step 5: Manage Access
- Admin can view all users
- Department Heads see their department users
- Lecturers see their classes' students

---

## 🏠 Workflow 6: Using Lecturer Dashboard

### Step 1: Login as Lecturer
```
Email: lecturer@demo.com
Password: password
```

### Step 2: View Dashboard
- Automatically shown after login
- Or click "Dashboard" > "Lecturer Dashboard"

### Step 3: Monitor Statistics
- **Your Classes**: Number of classes you teach
- **Total Students**: Enrolled across all classes
- **Sessions Created**: QR sessions made
- **Avg. Attendance Rate**: Overall attendance percentage

### Step 4: View Classes Overview
- Grid of your classes
- Each card shows:
  - Class code and name
  - Schedule
  - Number of students
  - Action buttons

### Step 5: Check Recent Sessions
- Table below shows latest sessions
- Session info with date, time, status
- Attendance count for each session

### Step 6: Quick Actions
- **Generate QR Code**: Direct link to QR generation
- **View My Classes**: Navigate to classes page
- **View Reports**: Go to reports/analytics
- **View Dashboard**: Return to main dashboard

---

## 🎛️ Workflow 7: Admin Dashboard Features

### Step 1: Login as Admin
```
Email: admin@demo.com
Password: password
```

### Step 2: View System Statistics
- **Total Users**: All registered users
- **Active Classes**: Currently available classes
- **Today's Attendance**: Marks recorded today
- **Avg. Attendance Rate**: System-wide percentage

### Step 3: Analyze by Class
- Table showing all classes
- Attendance count for each
- Status badge (Good/Moderate)

### Step 4: Manage Everything
- View and manage all users
- Create and update classes
- Monitor attendance globally
- Generate comprehensive reports

---

## 🌙 Workflow 8: Using Dark Mode

### Step 1: Toggle Dark Mode
- Click moon icon in top navigation
- Or sun icon if already in dark mode

### Step 2: Automatic Saving
- Preference saves automatically
- Persists across sessions
- All pages support dark mode

### Step 3: Accessibility
- Improved for low-light environments
- Better for eye strain
- Consistent across all pages

---

## 🔍 Workflow 9: Searching and Filtering

### Classes Search
```
Search: "CS101"     → Find class by code
Search: "Programming" → Find by name
Search: "Computer" → Find by department
```

### Users Search
```
Search: "john"      → Find by username
Search: "@demo.com" → Find by email
Search: "lecturer"  → Find by role
Search: "Tech"      → Find by department
```

### Results
- Real-time filtering as you type
- Shows matching results only
- Clear message if no results
- Can clear search to reset

---

## 📥 Workflow 10: Importing/Using Demo Data

### What's Included
- 3 demo users (admin, lecturer, student)
- 3 sample classes
- Sample attendance records

### How to Access
1. Login with demo credentials
2. All demo data pre-loaded
3. Create additional data as needed

### Reset Demo Data
```bash
# Delete database file
rm attendance.db

# Restart server
npm run dev

# Demo data re-created automatically
```

---

## ⚠️ Workflow 11: Error Recovery

### Form Validation Error
1. **Problem**: Submit button disabled
2. **Solution**: Fill in all required fields
3. **Check**: Red error message shows what's wrong
4. **Action**: Fix the field and try again

### Network Error
1. **Problem**: "Failed to load..." message
2. **Solution**: Check internet connection
3. **Action**: Click close button on alert
4. **Retry**: Try the operation again

### QR Code Scan Error
1. **Problem**: Scanning not working
2. **Solution**: 
   - Ensure good lighting
   - Hold QR code at 90 degrees
   - Keep within frame
3. **Action**: Try scanning again

### Time Validation Error
1. **Problem**: "Start time must be before end time"
2. **Solution**: Adjust times so start < end
3. **Example**: Start 10:00, End 12:00 ✓

### Date Validation Error
1. **Problem**: "Cannot create session for a past date"
2. **Solution**: Select today or future date
3. **Why**: Can't create retroactive attendance

---

## 🔐 Workflow 12: Security Best Practices

### Password Management
- Never share passwords
- Change password regularly
- Use strong passwords

### Session Management
- Log out after use
- Don't leave system unattended
- Clear browser cache periodically

### Data Protection
- Don't share sensitive links
- Report suspicious activity
- Keep credentials confidential

---

## 📱 Workflow 13: Mobile Usage

### Responsive Design
- All workflows work on mobile
- Touch-friendly buttons
- Readable text on small screens
- Easy navigation

### QR Scanning on Mobile
1. Use mobile device to scan
2. Camera access required
3. Portrait orientation works best
4. Good lighting recommended

### Viewing Reports
- Tables scroll horizontally
- Charts render responsively
- Easy to read on small screens

---

## 🎓 Workflow 14: First Day Setup

### Admin Setup (5 minutes)
1. Login as admin
2. Create classes for upcoming sessions
3. Set up lecturer accounts
4. Enroll students

### Lecturer Setup (5 minutes)
1. Login as lecturer
2. View assigned classes
3. Generate first QR code
4. Share with students

### Student Setup (1 minute)
1. Login as student
2. Navigate to QR scanner
3. Test scan with sample QR
4. Mark attendance

---

## 💡 Workflow 15: Advanced Tips

### Tip 1: Keyboard Navigation
- Tab to navigate fields
- Enter to submit
- Esc to close modals

### Tip 2: Quick Actions
- Use sidebar shortcuts
- Dashboard quick action buttons
- Lecturer dashboard fast access

### Tip 3: Search Efficiency
- Search as you type (instant)
- Combine multiple search terms
- Use unique identifiers (email, code)

### Tip 4: Export Workflow
- Export at end of week/month
- Save with date in filename
- Keep backups

### Tip 5: Device Management
- Lecturer device: For class management
- Student device: For QR scanning
- Admin device: For oversight

---

## 🚀 Workflow 16: Scaling Up

### Adding More Users
1. Admin creates lecturer accounts
2. Lecturers create classes
3. Admin enrolls students
4. System handles many users smoothly

### Managing Multiple Classes
1. Each lecturer manages own classes
2. Department heads oversee departments
3. Admin has system-wide view
4. Reports consolidate data

### High Volume Attendance
- QR codes handle many scans
- Real-time processing
- Reliable attendance marking
- Fast report generation

---

## Summary Quick Reference

| Task | User | Steps | Time |
|------|------|-------|------|
| Login | All | Email + Password | 30s |
| Create Class | Lecturer | Fill form, submit | 1m |
| Generate QR | Lecturer | Select class, set time | 30s |
| Mark Attendance | Student | Scan QR code | 5s |
| View Reports | Admin | Click Reports, analyze | 2m |
| Manage Users | Admin | Click Users, search | 5m |
| Check History | Student | Go to Dashboard | 30s |
| Export Data | Admin | Click Export CSV | 1m |

---

**Version:** 1.0.0
**Last Updated:** December 2024
**Status:** Complete

