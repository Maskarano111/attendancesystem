# Testing Checklist - Smart Student Attendance System

After the bug fixes, please follow this comprehensive testing checklist to ensure all systems are working correctly.

## 1. Authentication & Authorization

### Login Tests
- [ ] Login as **admin** (email: admin@demo.com, password: password)
- [ ] Login as **lecturer** (email: lecturer@demo.com, password: password)
- [ ] Login as **student** (email: student@demo.com, password: password)
- [ ] Verify each role is redirected to correct dashboard
- [ ] Test invalid credentials result in proper error message
- [ ] Test account creation with new user

### Authorization Tests
- [ ] Admin can access: Dashboard, Users, Classes, Reports, Generate QR, Session Control, Audit Log, System Settings
- [ ] Lecturer can access: Dashboard, Lecturer dashboard, Generate QR, Classes, Reports
- [ ] Student can access: Dashboard, Scan QR, Reports
- [ ] Department Head can access: Dashboard, Users, Classes, Reports, Session Control, Audit Log, System Settings
- [ ] Verify students CANNOT access admin pages (should redirect to dashboard)
- [ ] Verify lecturers CANNOT access admin pages (should redirect to dashboard)

## 2. Dashboard Tests

### Admin Dashboard
- [ ] Page loads without errors
- [ ] Attendance stats display correctly with classes and attendance counts
- [ ] "Total Users" stat displays correct number
- [ ] "Active Classes" stat displays correct number
- [ ] "Today's Attendance" stat displays correct count
- [ ] "Avg. Attendance Rate" percentage displays and calculates correctly
- [ ] Attendance by Class table displays:
  - [ ] Class names visible
  - [ ] Attendance counts accurate
  - [ ] Status indicators visible
- [ ] Quick action buttons work:
  - [ ] "Manage Users" button navigates to /users
  - [ ] "Manage Classes" button navigates to /classes
  - [ ] "Reports" button navigates to /reports
  - [ ] "System Settings" button works

### Lecturer Dashboard
- [ ] Loads successfully with fallback mock data if API fails
- [ ] Displays lecturer's classes
- [ ] Displays active sessions
- [ ] Displays recent attendance records

### Student Dashboard
- [ ] Loads without errors
- [ ] Displays recent attendance records
- [ ] Shows attendance history

## 3. QR Code Generation

### QR Generation Form
- [ ] Form loads successfully
- [ ] Class dropdown shows available classes
- [ ] Can select a class from dropdown
- [ ] Can input date (should not allow past dates)
- [ ] Can input start time
- [ ] Can input end time
- [ ] "Generate QR Code" button works
- [ ] Form validation:
  - [ ] Must select a class
  - [ ] Must select a future date (past dates show error)
  - [ ] Must enter start and end times
  - [ ] Start time must be before end time
  - [ ] Generates unique session ID each time

### QR Code Display & Download
- [ ] QR code image displays after generation
- [ ] QR code data contains:
  - [ ] Correct session_id
  - [ ] Correct class_id
  - [ ] Correct timestamp
- [ ] Download button creates file with correct name format
- [ ] QR code can be read by barcode scanner

## 4. Attendance Marking

### QR Scanning
- [ ] QR scanner initializes without errors
- [ ] Camera permission request works
- [ ] Scanning a generated QR code marks attendance
- [ ] Success message displays after marking
- [ ] Auto-restart scanner after 3 seconds
- [ ] Error handling for invalid QR codes

### Attendance Records
- [ ] Records show as "present" when marked via QR
- [ ] Cannot mark same session twice (get error message)
- [ ] Session must be "active" to mark attendance (closed sessions rejected)
- [ ] Wrong QR code format shows clear error

## 5. Class Management

### Viewing Classes
- [ ] Admin can view all classes
- [ ] Lecturer can view only their own classes
- [ ] Department Head can view classes in their department
- [ ] Class list displays:
  - [ ] Class code
  - [ ] Class name
  - [ ] Lecturer name
  - [ ] Schedule
  - [ ] Department
  - [ ] Capacity

### Creating Classes
- [ ] Lecturer can create class and it auto-assigns them as lecturer
- [ ] Admin can create class and assign lecturer via dropdown
- [ ] Department Head can only create classes in their department
- [ ] Required fields validation works
- [ ] New class appears in list immediately

### Editing Classes
- [ ] Admin/Department Head can edit class details
- [ ] Cannot edit class code to duplicate existing code (gets error)
- [ ] Changes save and immediately reflect in list

### Deleting Classes
- [ ] Admin/Department Head can delete classes
- [ ] Deleted class disappears from list
- [ ] Cascade delete or prevent delete if sessions exist (verify behavior)

## 6. User Management

### Viewing Users
- [ ] Admin can see all users
- [ ] Department Head can see only users in their department
- [ ] User list shows:
  - [ ] Username
  - [ ] Email
  - [ ] Role with color-coded badge
  - [ ] Department
  - [ ] Active status

### Creating Users
- [ ] Can create student
- [ ] Can create lecturer
- [ ] Can create admin (admin only)
- [ ] Can create department_head (admin only)
- [ ] Settings department on creation
- [ ] Auto-generates temporary password if not provided

### Editing Users
- [ ] Can change username
- [ ] Can change email (must be unique)
- [ ] Can change role
- [ ] Can change department (if applicable)
- [ ] Changes persist

### User Status Management
- [ ] Can disable/enable user accounts
- [ ] Disabled users cannot login
- [ ] Disabled user gets error message "account is disabled"
- [ ] Can re-enable disabled users

### Password Reset
- [ ] "Reset Password" button works
- [ ] Returns temporary password
- [ ] Shows success message with new password
- [ ] Temporary password works for next login

## 7. Reports & Analytics

### Overview Reports
- [ ] Displays class-wise attendance statistics
- [ ] Bar chart shows attendance counts
- [ ] Pie chart shows attendance distribution
- [ ] Can view reports by class (if session parameter provided)

### Session Management
- [ ] Can view all active sessions
- [ ] Can close active sessions
- [ ] Closed sessions no longer accept attendance
- [ ] Closed sessions have visual indicator

### Audit Logs
- [ ] Shows recent system actions
- [ ] Records include:
  - [ ] Username of who performed action
  - [ ] Type of action (CREATE_USER, UPDATE_CLASS, etc.)
  - [ ] Entity type
  - [ ] Timestamp
- [ ] Limited to last 200 entries
- [ ] Properly formatted timestamps

### System Settings
- [ ] Can set term start date
- [ ] Can set term end date
- [ ] Can set QR expiry time in minutes
- [ ] Can set attendance rules
- [ ] Settings persist after save
- [ ] Changes apply to new sessions

## 8. Error Handling

### API Errors
- [ ] Network errors show appropriate error messages
- [ ] 401 Unauthorized redirects to login
- [ ] 403 Forbidden shows permission error
- [ ] 404 Not Found shows not found error
- [ ] 500 Server errors show generic error message
- [ ] Users can dismiss error alerts

### Form Validation
- [ ] Required fields show validation error if empty
- [ ] Invalid email format shows error
- [ ] Password too short shows error
- [ ] Duplicate email/username shows error
- [ ] Date/time validation works correctly

## 9. UI/UX

### Responsiveness
- [ ] Works on desktop (1920px+)
- [ ] Works on tablet (768px+)
- [ ] Works on mobile (375px+)
- [ ] Sidebar collapses on mobile
- [ ] All buttons accessible on mobile
- [ ] Forms fit on mobile screens

### Navigation
- [ ] All nav links work correctly
- [ ] Current page highlighted in sidebar
- [ ] "Logout" button logs out and redirects to login
- [ ] Logo/brand name clickable and goes to dashboard

### Loading States
- [ ] Skeleton loaders show while data loads
- [ ] Buttons show loading spinner during submission
- [ ] API calls with loading indicators prevent double-submission

## 10. Data Integrity

### Database Constraints
- [ ] Cannot create user with duplicate email
- [ ] Cannot create user with duplicate username
- [ ] Cannot create class with duplicate code
- [ ] Cannot mark attendance for closed session
- [ ] Cannot mark attendance twice for same session

### Data Relationships
- [ ] Users can be deleted if no sessions reference them
- [ ] Classes can be deleted if proper cascade/constraints
- [ ] Sessions properly link to classes
- [ ] Attendance records properly link to session and user

## 11. Performance

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Reports load in < 3 seconds
- [ ] User list loads in < 2 seconds
- [ ] Class list loads in < 2 seconds

### Mobile Performance
- [ ] QR camera initializes within 1 second
- [ ] Scanning is responsive
- [ ] No lag when scrolling lists

## 12. Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Critical Test Scenarios

### End-to-End: Student Attendance
1. Lecturer logs in
2. Generates QR code for class with valid time
3. Student logs in
4. Navigates to Scan QR page
5. Scans the QR code
6. Attendance marked successfully
7. Attendance shows in both student's and lecturer's records

### End-to-End: Admin User Management
1. Admin logs in
2. Navigates to Users
3. Creates new user (lecturer)
4. Edits user details
5. Resets user password
6. Gets temporary password
7. Disables user
8. Verifies disabled user cannot login
9. Re-enables user

### End-to-End: Reports Generation
1. Admin logs in
2. Goes to Reports/Overview
3. Views attendance statistics
4. Goes to Sessions tab
5. Closes an active session
6. Views Audit Log
7. Sees all recent actions with timestamps

---

## Bug Fix Verification

Verify these specific bugs are fixed:

- [ ] Dashboard attendance table displays without crashing (class_id fix)
- [ ] Login works and doesn't throw ReferenceError (variable name fix)
- [ ] QR generation form works correctly (handleGenerate fix)
- [ ] Lecturer can create classes (lecturer_id logic fix)
- [ ] Admin can create classes and assign lecturers (lecturer_id logic fix)
- [ ] Attendance stats show all classes with counts (SQL fix)

---

**Start Testing Date:** _______________  
**End Testing Date:** _______________  
**Tested By:** _______________  
**Issues Found:** _______________

**Overall Status:** 
- [ ] All passed - Ready for production
- [ ] Minor issues - Minor fixes needed
- [ ] Major issues - Needs rework
