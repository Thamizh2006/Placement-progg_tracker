# API Testing Guide

This guide helps you test all API endpoints and shows exactly what to send in request body.

## Base URL

`http://localhost:5000/api`

## Common Headers

- `Content-Type: application/json`
- `Authorization: Bearer <TOKEN>` for protected routes

## Valid Values

- Roles: `student`, `faculty`, `hod`, `placement`, `superadmin`
- Departments: `CSE`, `ECE`, `EEE`, `MECH`, `IT`, `ADS`, `CYBER SECURITY`, `CHEMICAL`, `BIOTECHNOLOGY`
- Categories: `5lpa`, `7lpa`, `10lpa`

---

## 1) Auth Endpoints (`/auth`)

### POST `/auth/register`

- Purpose: Create user account
- Body:

```json
{
  "email": "student1@cse.edu",
  "password": "password123",
  "role": "student",
  "department": "CSE"
}
```

- Note: `department` is required for `student`, `faculty`, `hod`.

### POST `/auth/login`

- Purpose: Login and get JWT token
- Body:

```json
{
  "email": "student1@cse.edu",
  "password": "password123"
}
```

### POST `/auth/logout`

- Purpose: Logout current user
- Body: none

### DELETE `/auth/delete-me`

- Purpose: Delete self account
- Body: none

### DELETE `/auth/delete-user/:userId`

- Purpose: Superadmin deletes any user
- Body: none

### POST `/auth/forgot-password`

- Purpose: Send reset-password link
- Body:

```json
{
  "email": "student1@cse.edu"
}
```

### POST `/auth/reset-password/:token`

- Purpose: Set new password
- Body:

```json
{
  "password": "newPassword123"
}
```

---

## 2) Student Endpoints (`/student`) - Role: `student`

### POST `/student/select-category`

- Purpose: Select/replace student category
- Body:

```json
{
  "category": "5lpa"
}
```

### GET `/student/my-progress`

- Purpose: Get logged-in student progress
- Body: none

### GET `/student/check-eligibility`

- Purpose: Check placement eligibility
- Body: none

### POST `/student/update-task`

- Purpose: Mark one task as complete
- Required body:

```json
{
  "rowTitle": "Aptitude",
  "taskName": "Quantitative"
}
```

- Optional fields:

```json
{
  "proofUrl": "https://example.com/proof.png",
  "proofType": "screenshot"
}
```

- `proofType` allowed: `screenshot`, `document`

### GET `/student/faculty`

- Purpose: Get available faculty mentors
- Body: none
- Optional query: `?department=CSE`

### GET `/student/mentor`

- Purpose: Get current mentor
- Body: none

### POST `/student/choose-mentor`

- Purpose: Select mentor
- Body:

```json
{
  "facultyId": "64f1234abcde123456789012"
}
```

### PUT `/student/change-mentor`

- Purpose: Change mentor
- Body:

```json
{
  "facultyId": "64f1234abcde123456789099"
}
```

### POST `/student/ask-doubt`

- Purpose: Raise doubt to assigned mentor
- Required body:

```json
{
  "subject": "Task Clarification",
  "message": "I need help with this task."
}
```

- Optional:

```json
{
  "taskName": "Quantitative",
  "category": "5lpa"
}
```

### GET `/student/my-doubts`

- Purpose: List my doubts
- Body: none

### GET `/student/my-doubts/:doubtId`

- Purpose: Get one doubt thread
- Body: none

### POST `/student/generate-report`

- Purpose: Generate and store report data
- Body: none

### GET `/student/download-report`

- Purpose: Get latest generated report
- Body: none

---

## 3) Faculty Endpoints (`/faculty`) - Role: `faculty`

### GET `/faculty/dashboard`

- Purpose: Faculty dashboard stats
- Body: none

### GET `/faculty/students`

- Purpose: Get assigned students
- Body: none

### GET `/faculty/all-students`

- Purpose: Get all students
- Body: none
- Optional query: `?department=CSE`

### GET `/faculty/students/:studentId/progress`

- Purpose: Get selected assigned student progress
- Body: none

### GET `/faculty/students-progress`

- Purpose: Get progress for all assigned students
- Body: none

### GET `/faculty/doubts`

- Purpose: List faculty doubts
- Body: none
- Optional query: `?status=pending` or `?status=answered`

### GET `/faculty/doubts-stats`

- Purpose: Doubt stats + recent pending
- Body: none

### GET `/faculty/doubts/:doubtId`

- Purpose: Get one doubt thread
- Body: none

### PUT `/faculty/doubts/:doubtId/respond`

- Purpose: Reply to doubt
- Body:

```json
{
  "response": "Here is the solution and explanation."
}
```

---

## 4) HOD Endpoints (`/hod`) - Role: `hod`

### GET `/hod/dashboard`

- Purpose: Department dashboard
- Body: none

### GET `/hod/faculty`

- Purpose: Get department faculty
- Body: none

### GET `/hod/staff`

- Purpose: Get faculty + hod in department
- Body: none

### GET `/hod/faculty-assignments`

- Purpose: Faculty-wise assigned student details
- Body: none

### POST `/hod/assign-mentor`

- Purpose: Assign student to faculty (same department)
- Body:

```json
{
  "studentId": "64f1234abcde123456789111",
  "facultyId": "64f1234abcde123456789222"
}
```

### GET `/hod/students`

- Purpose: Get department students with filters
- Body: none
- Optional queries:
- `?category=5lpa`
- `?eligible=true`
- `?minProgress=60`

### GET `/hod/students/:studentId`

- Purpose: Student full details
- Body: none

### GET `/hod/doubts-summary`

- Purpose: Department doubt summary
- Body: none

---

## 5) Admin Endpoints (`/admin`)

### GET `/admin/dashboard`

- Roles: `superadmin`, `placement`
- Purpose: Overall dashboard
- Body: none

### GET `/admin/students`

- Roles: `hod`, `faculty`, `placement`, `superadmin`
- Purpose: Filtered student progress
- Body: none
- Optional queries:
- `?category=5lpa`
- `?minProgress=75`
- `?department=CSE`

### GET `/admin/all-students`

- Roles: `superadmin`
- Purpose: All students
- Body: none
- Optional queries: `?department=CSE|ALL`, `?category=5lpa|7lpa|10lpa`

### GET `/admin/faculty`

- Roles: `superadmin`, `placement`
- Purpose: All faculty + counts
- Body: none
- Optional query: `?department=CSE|ALL`

### DELETE `/admin/faculty/:facultyId`

- Roles: `superadmin`
- Purpose: Delete faculty
- Body: none

### POST `/admin/assign-student`

- Roles: `superadmin`, `placement`, `hod`
- Purpose: Assign student to faculty
- Body:

```json
{
  "studentId": "64f1234abcde123456789111",
  "facultyId": "64f1234abcde123456789222"
}
```

### GET `/admin/hods`

- Roles: `superadmin`
- Purpose: Get all HODs
- Body: none

### GET `/admin/reports`

- Roles: `placement`, `superadmin`
- Purpose: Detailed student reports
- Body: none
- Optional queries: `?department=CSE|ALL`, `?eligible=true|false`, `?category=5lpa|7lpa|10lpa`

### GET `/admin/department-stats`

- Roles: `placement`, `superadmin`
- Purpose: Department analytics
- Body: none

### GET `/admin/doubts-stats`

- Roles: `placement`, `superadmin`
- Purpose: Global doubt stats
- Body: none

---

## 6) Progress Endpoints (`/progress`) - Alternate Progress Routes

### POST `/progress/select`

- Role: `student`
- Purpose: Select category
- Body:

```json
{
  "category": "5lpa"
}
```

### POST `/progress/update-task`

- Role: `student`
- Purpose: Update completed task
- Required body:

```json
{
  "rowTitle": "Aptitude",
  "taskName": "Quantitative"
}
```

- Optional: `proofUrl`, `proofType`

### GET `/progress/my-progress`

- Role: `student`
- Purpose: Get own progress
- Body: none

### GET `/progress/all-progress`

- Roles in route: `faculty`, `admin`
- Purpose: Get all student progress
- Body: none
- Note: `admin` role is used in route, but user roles model has no `admin` role.

### GET `/progress/check-eligibility`

- Role: `student`
- Purpose: Check eligibility
- Body: none

---

## 7) Doubt Endpoints (`/doubt`) - Alternate Doubt Routes

### POST `/doubt/ask`

- Role: `student`
- Purpose: Ask doubt
- Required body:

```json
{
  "subject": "Need help with DSA",
  "message": "Please explain this task approach."
}
```

- Optional: `taskName`, `category`

### GET `/doubt/my`

- Role: `student`
- Purpose: My doubts
- Body: none

### GET `/doubt/my/:doubtId`

- Role: `student`
- Purpose: My doubt by id
- Body: none

### GET `/doubt/students`

- Role: `faculty`
- Purpose: Faculty student doubts
- Body: none
- Optional query: `?status=pending|answered|closed`

### PUT `/doubt/respond/:doubtId`

- Role: `faculty`
- Purpose: Respond to doubt
- Body:

```json
{
  "response": "Try this method and practice these problems."
}
```

### GET `/doubt/stats`

- Role: `faculty`
- Purpose: Doubt stats
- Body: none

### GET `/doubt/department`

- Role: `hod`
- Purpose: Department doubts
- Body: none
- Optional query: `?status=pending|answered|closed`

### GET `/doubt/all`

- Roles: `placement`, `superadmin`
- Purpose: All doubts
- Body: none
- Optional queries: `?status=pending|answered|closed`, `?department=CSE`

---

## 8) Report Endpoints (`/report`)

### POST `/report/generate`

- Role: `student`
- Purpose: Generate progress report
- Body: none

### GET `/report/my`

- Role: `student`
- Purpose: List my reports
- Body: none

### GET `/report/latest`

- Role: `student`
- Purpose: Latest report
- Body: none

### GET `/report/student/:studentId`

- Role: `faculty`
- Purpose: Assigned student latest report
- Body: none

### GET `/report/all`

- Roles: `placement`, `superadmin`
- Purpose: All reports
- Body: none
- Optional queries: `?department=CSE`, `?eligible=true|false`, `?category=5lpa|7lpa|10lpa`

### POST `/report/bulk`

- Roles: `placement`, `superadmin`
- Purpose: Bulk generate reports
- Optional body:

```json
{
  "department": "CSE",
  "category": "5lpa"
}
```

- If body empty, generates reports for all students that have progress.

### GET `/report/department`

- Role: `hod`
- Purpose: Department reports
- Body: none
- Optional queries: `?eligible=true|false`, `?category=5lpa|7lpa|10lpa`

### GET `/report/analytics`

- Role: `superadmin`
- Purpose: Cross-department analytics
- Body: none

---

## Suggested Testing Flow

1. Register users for all roles.
2. Login each user and save token.
3. Student: select category, update tasks, choose mentor.
4. Student: ask doubt.
5. Faculty: view doubts and respond.
6. Student: verify doubt thread.
7. Student: generate report.
8. HOD/Admin/Placement/Superadmin: test dashboards and analytics.
