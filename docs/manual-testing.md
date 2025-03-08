# Manual Testing Guide for Campus Connect App

This document outlines the manual testing procedures for the main user flows in the Campus Connect application.

## Prerequisites
- A test account with student role
- A test account with lecturer role
- A test account with admin role
- A device with a camera (for QR code testing)
- A device with location services enabled
- Two devices for testing real-time attendance updates (optional)

## 1. Authentication Testing

### 1.1 Sign-in
1. Navigate to the sign-in page
2. Attempt to sign in with invalid credentials
   - Verify appropriate error messages are displayed
3. Sign in with valid student credentials
   - Verify redirection to Student Dashboard
4. Sign out
5. Sign in with valid lecturer credentials
   - Verify redirection to Lecturer Dashboard
6. Sign out
7. Sign in with valid admin credentials
   - Verify redirection to Admin Dashboard

### 1.2 Password Reset
1. Navigate to the sign-in page
2. Click "Forgot Password"
3. Enter email address
4. Verify reset link/instructions are sent
5. Complete password reset process
6. Verify ability to sign in with new password

## 2. Student Role Testing

### 2.1 Course Enrollment
1. Sign in as a student
2. Navigate to the Courses tab
3. View available courses
4. Enroll in a course
   - Verify the course appears in "My Courses" section
5. Attempt to drop a course
   - Verify the course is removed from "My Courses"

### 2.2 Attendance Marking
1. Sign in as a student
2. Verify active sessions are displayed (if any)
3. For location-based attendance:
   - Enable location services
   - Verify distance calculation
   - Click "Mark Attendance"
   - Verify success message and attendance record
4. For QR-based attendance:
   - Click "Scan QR Code"
   - Scan a valid QR code (prepare this with lecturer account)
   - Verify success message and attendance record
5. Verify attendance statistics update correctly

### 2.3 View Schedule and Attendance History
1. Navigate to Schedule tab
   - Verify classes are grouped by day
   - Verify time and location display correctly
2. View Attendance tab
   - Verify attendance statistics (present, absent, percentage)
   - Check monthly attendance chart
3. Test export functionality
   - Export attendance data
   - Verify CSV file contains correct data

## 3. Lecturer Role Testing

### 3.1 Course Management
1. Sign in as a lecturer
2. Navigate to the Courses tab
3. Create a new course
   - Fill in all details and submit
   - Verify course appears in Active Courses
4. Edit a course
   - Modify details and save
   - Verify changes are reflected
5. Add a class session to a course
   - Add details like day, time, and room
   - Verify class appears in course details
6. Delete a class session
   - Confirm deletion
   - Verify class is removed
7. Archive a course
   - Verify course moves to Archived Courses tab

### 3.2 Attendance Session Management
1. Start an attendance session
   - Enable location services
   - Select a class
   - Set proximity radius
   - Start session
   - Verify active session notification
2. Generate QR code
   - Click "Generate QR Code"
   - Verify QR code appears
3. Mark attendance manually
   - Search for a student
   - Mark as present/absent/late
   - Verify attendance record
4. End attendance session
   - Click "End Session"
   - Verify session is closed

### 3.3 Attendance Analysis
1. View attendance records
   - Verify list of recent attendance records
   - Check filtering options
2. Check attendance statistics
   - Verify percentage calculations
   - View monthly charts
3. Export attendance data
   - Generate export
   - Verify data accuracy

## 4. Admin Role Testing

### 4.1 User Management
1. Sign in as admin
2. Navigate to User Management
3. Create a new user account
   - Create accounts for each role type
   - Verify accounts appear in user list
4. Edit user details
   - Modify name, email, role
   - Verify changes are saved
5. Deactivate/reactivate users
   - Verify status changes
   - Test sign-in with deactivated account (should fail)

### 4.2 System Settings
1. Navigate to Settings
2. Modify system preferences
   - Attendance proximity threshold
   - QR code expiry time
   - Other configurable parameters
3. Verify changes are applied system-wide

## 5. Responsiveness Testing

### 5.1 Desktop Views
1. Test all major flows on desktop browsers
2. Verify layouts display correctly at various window sizes
3. Check table views and data visualization

### 5.2 Mobile Views
1. Test all major flows on mobile devices/emulators
2. Verify navigation menu collapses appropriately
3. Verify touch interactions work (especially attendance marking)
4. Test camera access for QR scanning

### 5.3 Tablet Views
1. Test critical user journeys on tablet sizes
2. Verify UI elements are appropriately sized

## 6. Error Handling and Edge Cases

### 6.1 Offline Behavior
1. Disconnect from internet
2. Attempt key operations
3. Verify appropriate error messages
4. Reconnect and verify recovery behavior

### 6.2 Invalid Data Submissions
1. Test form validation across the application
2. Submit invalid data in each form
3. Verify validation messages are clear and helpful

### 6.3 Concurrent Session Handling
1. Sign in to the same account on two devices
2. Make changes on one device
3. Verify changes reflect on the other device or appropriate handling occurs

## 7. Performance Testing

### 7.1 Load Time
1. Measure initial load time
2. Check dashboard rendering time with large datasets
3. Verify attendance recording speed

### 7.2 Resource Usage
1. Monitor memory usage during extended sessions
2. Check battery impact of location tracking

## Bug Reporting Template

When reporting bugs, please include:

1. **Environment**: Browser/device/OS version
2. **User Role**: Student/Lecturer/Admin
3. **Steps to Reproduce**: Detailed step-by-step instructions
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots/Video**: If applicable
7. **Error Messages**: Copy exact text
8. **Frequency**: How often can you reproduce it?
9. **Additional Context**: Any other relevant information 