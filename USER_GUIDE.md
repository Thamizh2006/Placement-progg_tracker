# User Guide

This guide explains how to sign up, sign in, and use the Placement Prep portal as a student, faculty member, HOD, placement admin, or superadmin.

## 1. What This App Does

The Placement Prep portal is a role-based full-stack web application for placement preparation and academic progress monitoring.

It supports:

- Student progress tracking
- Faculty mentoring
- HOD department monitoring
- Placement admin operations
- Superadmin user and role control

## 2. Roles In The App

The app supports these roles:

- `student`
- `faculty`
- `hod`
- `placement`
- `superadmin`

Each role sees different pages and has different access after login.

## 3. Sign Up Instructions

### Who Can Sign Up From The Register Page

The public register page currently supports:

- `student`
- `faculty`
- `hod`

`placement` and `superadmin` accounts are created by admin users from the admin dashboard.

### What Details You Must Give

During sign up, the user must give:

- `email`
- `password`
- `confirm password`
- `role`
- `department`

### Email And Password Format

Use a real Gmail format such as:

- `realtime.student@gmail.com`
- `realtime.faculty@gmail.com`
- `realtime.hod@gmail.com`
- `realtime.superadmin@gmail.com`

Use a password such as:

- `Test@123`
- `Faculty@123`
- `Hod@123`
- `SuperAdmin@123`

### Default Superadmin Account

You can bootstrap one full-access superadmin account with:

- Email: `realtime.superadmin@gmail.com`
- Password: `SuperAdmin@123`

Run:

- `npm run create:superadmin`

### Steps To Create An Account

1. Open the app in your browser.
2. Go to the `Register` page.
3. Select your role:
   - `Student`
   - `Faculty`
   - `HOD`
4. Choose your department.
5. Enter your email.
6. Enter your password.
7. Re-enter the same password in `Confirm Password`.
8. Click `Create Account`.

### Registration Notes

- Department is required for `student`, `faculty`, and `hod`.
- Password and confirm password must match.
- If the email already exists, registration will fail.
- Password must be at least 6 characters.

## 4. Sign In Instructions

### What Details You Must Give

To log in, the user must give:

- `email`
- `password`

### Login Example

Example:

- Email: `realtime.student@gmail.com`
- Password: `Test@123`

### Steps To Log In

1. Open the app.
2. Go to the `Login` page.
3. Enter your registered email.
4. Enter your password.
5. Click `Sign in`.

### What Happens After Login

The app automatically redirects users based on role:

- `student` -> `/student/dashboard`
- `faculty` -> `/faculty/dashboard`
- `hod` -> `/hod/dashboard`
- `placement` -> `/admin/dashboard`
- `superadmin` -> `/admin/dashboard`

If login fails:

- Check that the email is correct
- Check that the password is correct
- Make sure the account was created successfully
- Make sure the backend server is running

## 5. How Navigation Works

After login, the sidebar menu changes based on role.

### Student Menu

- Dashboard
- Progress
- Mentor
- Doubts
- Reports

### Faculty Menu

- Dashboard
- Students
- Doubts
- Progress
- Resources

### HOD Menu

- Dashboard
- Faculty
- Students
- Analytics
- Assignments

### Placement Admin Menu

- Dashboard
- Students
- Analytics
- Reports
- Departments

### Superadmin Menu

- Dashboard
- All Users
- Departments
- Analytics
- Reports
- Settings
- Roles

## 6. How Students Use The App

Students use the app to manage placement preparation.

### Student Dashboard

The dashboard shows:

- Overall progress
- Assigned mentor
- Pending doubts
- Reports ready

### Student Progress

Students can:

- View progress tracker
- Monitor eligibility status
- Refresh latest progress data
- Generate reports when available

### Mentor Section

Students can:

- View mentor information
- Review mentorship details

### Doubts Section

Students can:

- Raise doubts
- Track pending and answered doubts

Important:

- Students cannot post public forum messages
- Students can ask doubts only to their assigned mentor

### Reports Section

Students can:

- View reports
- Track readiness and eligibility

## 7. How Faculty Use The App

Faculty members guide students through the portal.

### Faculty Dashboard

Faculty can see:

- Assigned students
- Pending doubts
- Average progress
- Completed reviews

### Students Section

Faculty can:

- View assigned mentees
- Track readiness
- Review mentoring load

### Doubts Section

Faculty can:

- Review student questions
- Respond to doubts
- Clear pending items

### Progress Section

Faculty can:

- Review student progress
- Identify students who need support

### Resources Section

Faculty can:

- Manage or share resources
- Post placement announcements in the forum

## 8. How HODs Use The App

HODs manage department-level performance.

### HOD Dashboard

The dashboard shows:

- Faculty count
- Student count
- Average progress
- Placement rate
- Live category mix
- Mentor performance chart

### Faculty Section

HODs can:

- Review department faculty
- Check mentoring performance

### Students Section

HODs can:

- View department students
- Monitor department-wide progress

### Analytics Section

HODs can:

- Review department trends
- Compare department readiness
- View student performance charts
- View faculty performance charts
- Download student performance PDF
- Download staff performance PDF

### Assignments Section

HODs can:

- Help assign faculty to students within the department
- Post department or placement updates in the forum

## 9. How Placement Admins Use The App

Placement admins manage the platform workflow.

### Admin Dashboard

The admin dashboard shows:

- Total students
- Total faculty
- Average progress
- Pending doubts
- Department placement health
- Faculty capacity
- Recent reports
- Recent doubts
- Role access scope

### Create User

Placement admins can create:

- Student accounts
- Faculty accounts
- HOD accounts

### Assign Mentor

Placement admins can:

- Select an unassigned student
- Select a faculty mentor
- Assign the student to the faculty member

### Reports And Analytics

Placement admins can:

- Review placement readiness
- Analyze department trends
- Monitor report generation
- Post placement updates, mock interviews, assessments, examinations, and company visit notices
- View realtime dashboard charts
- Open live report filters

## 10. How Superadmins Use The App

Superadmins have the highest access.

They can:

- Access all admin dashboards
- View all users
- Manage all roles
- Create all user types
- Review departments, reports, and analytics
- Access settings and role-management pages
- Post institution-wide placement forum announcements
- View cross-department student performance charts
- View faculty performance charts for all departments
- Download student performance PDF reports
- Download staff performance PDF reports

### Superadmin Login

Use:

- Email: `realtime.superadmin@gmail.com`
- Password: `SuperAdmin@123`

## 10A. Placement Forum Rules

The app includes a placement forum visible across the portal.

Who can view forum posts:

- Students
- Faculty
- HOD
- Placement admin
- Superadmin

Who can create forum posts:

- Faculty
- HOD
- Placement admin
- Superadmin

Who cannot create forum posts:

- Students

Recommended forum use cases:

- Mock interview schedule
- Assessment updates
- Examination notifications
- Company visit announcements
- Placement preparation notices

## 11. Logout Instructions

To log out:

1. Open the sidebar.
2. Click `Logout`.
3. The app clears the login token and returns to the login page.

## 12. Common Problems And Fixes

### Register Gives Error

Possible reasons:

- Passwords do not match
- Email already exists
- Department was not selected
- Backend server is not running

### Login Gives Error

Possible reasons:

- Wrong email
- Wrong password
- Account does not exist
- Backend server is not running
- Token expired and the app redirected to login

### `502 Bad Gateway` On Register Or Login

This usually means:

- The frontend is running but the backend server is not running
- The frontend proxy port and backend port do not match

Current local setup:

- Backend API: `http://localhost:3000`
- Frontend: Vite development server
- Frontend API path: `/api`

### Unauthorized Page Appears

This means:

- Your role does not have access to that route
- You tried to open another role's page manually

## 13. Recommended Usage Flow

### For A New Student

1. Register an account
2. Log in with email and password
3. Open dashboard
4. Check progress and eligibility
5. Review mentor information
6. Raise doubts when needed
7. Monitor reports

### For A Faculty Member

1. Register or receive an account
2. Log in with email and password
3. Review assigned students
4. Answer pending doubts
5. Monitor progress regularly

### For A HOD

1. Log in
2. Review faculty and student counts
3. Check analytics
4. Coordinate assignments

### For Placement Admin Or Superadmin

1. Log in
2. Open admin dashboard
3. Review system-wide metrics
4. Create users as needed
5. Assign students to faculty
6. Open analytics for live charts
7. Download PDF reports if needed
8. Monitor doubts, reports, and departments

## 14. Local Run Instructions

If you are testing the app locally:

1. Start the backend server
2. Start the frontend server
3. Open the frontend in the browser
4. Register a supported role or create admin users from the admin dashboard

Typical local flow:

- Backend API runs on `http://localhost:3000`
- Frontend runs through Vite
- Frontend API calls are proxied through `/api`

## 15. Quick Summary

- Give `email` and `password` during sign in
- Give `email`, `password`, `confirm password`, `role`, and `department` during sign up
- Use `Register` to create `student`, `faculty`, or `hod` accounts
- Use `Login` to access the role-specific dashboard
- Students track progress and doubts
- Faculty mentor students
- HODs manage departments
- Placement admins manage users, analytics, and assignments
- Superadmins manage everything and can export student/staff PDFs
