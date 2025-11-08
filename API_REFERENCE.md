# Postman Quick Reference - Application System

## Authentication

### 1. Login as Student

```http
POST http://localhost:8000/api/users/login/
Content-Type: application/json

{
  "email": "student@test.com",
  "password": "testpass123"
}
```

**Save the `access` token from response!**

### 2. Login as Organizer

```http
POST http://localhost:8000/api/users/login/
Content-Type: application/json

{
  "email": "organizer@test.com",
  "password": "testpass123"
}
```

---

## Student Endpoints

### Create Application

```http
POST http://localhost:8000/api/activities/applications/create/
Authorization: Bearer YOUR_STUDENT_TOKEN
Content-Type: application/json

{
  "activity": 1
}
```

### List My Applications

```http
GET http://localhost:8000/api/activities/applications/list/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

### View Application Detail

```http
GET http://localhost:8000/api/activities/applications/1/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

### Cancel Application

```http
POST http://localhost:8000/api/activities/applications/1/cancel/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

### Get My Approved Activities

```http
GET http://localhost:8000/api/activities/my-approved-activities/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

**Returns:** List of activities where student's application has been approved.

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Beach Cleanup Day",
    "status": "open",
    "user_application_status": "approved",
    "max_participants": 50,
    "current_participants": 35
    // ... other activity fields
  }
]
```

### Check In to Activity

```http
POST http://localhost:8000/api/activities/1/checkin/
Authorization: Bearer YOUR_STUDENT_TOKEN
Content-Type: application/json

{
  "code": "ABC123"
}
```

**Requirements:**

- Student must have an approved application
- Code must be valid for today
- Activity must be currently happening (between start_at and end_at)
- Student hasn't already checked in

**Response Example:**

```json
{
  "detail": "Successfully checked in!",
  "check_in": {
    "id": 1,
    "activity": 1,
    "activity_title": "Beach Cleanup Day",
    "student": 5,
    "student_email": "student@test.com",
    "student_name": "John Doe",
    "attendance_status": "present",
    "checked_in_at": "2025-11-05T10:30:00Z",
    "marked_absent_at": null
  }
}
```

### Get My Check-in Status

```http
GET http://localhost:8000/api/activities/1/checkin-status/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

**Response (if checked in):**

```json
{
  "id": 1,
  "activity": 1,
  "activity_title": "Beach Cleanup Day",
  "student": 5,
  "student_email": "student@test.com",
  "student_name": "John Doe",
  "attendance_status": "present",
  "checked_in_at": "2025-11-05T10:30:00Z",
  "marked_absent_at": null
}
```

**Response (if not checked in):**

```json
{
  "detail": "No check-in record found",
  "has_checked_in": false
}
```

### Browse Activities with Application Status

```http
GET http://localhost:8000/api/activities/list/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Beach Cleanup",
    "user_application_status": "approved"
    // ... other fields
  },
  {
    "id": 2,
    "title": "Tree Planting",
    "user_application_status": "pending"
    // ... other fields
  },
  {
    "id": 3,
    "title": "Food Drive",
    "user_application_status": null
    // ... other fields
  }
]
```

**Possible values for `user_application_status`:**

- `"pending"` - Application submitted, awaiting review
- `"approved"` - Application accepted
- `"rejected"` - Application declined
- `"cancelled"` - Student cancelled application
- `null` - No application submitted

---

## Organizer Endpoints

### Get Today's Check-in Code

```http
GET http://localhost:8000/api/activities/1/checkin-code/
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

**Returns:** The 6-character check-in code valid for today. A new code is automatically generated each day.

**Response Example:**

```json
{
  "id": 5,
  "code": "AN6813",
  "valid_date": "2025-11-05",
  "created_at": "2025-11-05T00:00:15Z"
}
```

### List All Check-ins for Activity

```http
GET http://localhost:8000/api/activities/1/checkin-list/
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

**Returns:** All check-in records (present and absent) for the activity.

**Response Example:**

```json
[
  {
    "id": 1,
    "activity": 1,
    "activity_title": "Beach Cleanup Day",
    "student": 5,
    "student_email": "student1@test.com",
    "student_name": "John Doe",
    "attendance_status": "present",
    "checked_in_at": "2025-11-05T10:30:00Z",
    "marked_absent_at": null
  },
  {
    "id": 2,
    "activity": 1,
    "activity_title": "Beach Cleanup Day",
    "student": 7,
    "student_email": "student2@test.com",
    "student_name": "Jane Smith",
    "attendance_status": "absent",
    "checked_in_at": null,
    "marked_absent_at": "2025-11-05T18:00:00Z"
  }
]
```

### List Applications for Activity

```http
GET http://localhost:8000/api/activities/1/applications/
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

### Approve Application

```http
POST http://localhost:8000/api/activities/applications/1/review/
Authorization: Bearer YOUR_ORGANIZER_TOKEN
Content-Type: application/json

{
  "action": "approve"
}
```

### Reject Application (with reason)

```http
POST http://localhost:8000/api/activities/applications/1/review/
Authorization: Bearer YOUR_ORGANIZER_TOKEN
Content-Type: application/json

{
  "action": "reject",
  "reason": "We require students with prior volunteer experience for this activity."
}
```

---

## Test Cases

### Should Succeed

1. **Student creates application**

   - Activity status = "open"
   - Activity not full
   - First time applying to this activity

2. **Student cancels pending application**

   - Application status = "pending" or "approved"

3. **Organizer approves pending application**

   - Same organization as activity

4. **Organizer rejects with valid reason**

   - Reason: 1-225 characters
   - Same organization as activity

5. **Student fetches approved activities**

   - Returns only activities where application is approved
   - Empty array if no approved applications

6. **Activity list shows application status**

   - Each activity includes `user_application_status` field
   - Shows current status: pending/approved/rejected/cancelled/null

7. **Student checks in with valid code**

   - Student has approved application
   - Code is correct for today
   - Activity is currently happening

8. **Organizer gets today's check-in code**

   - New code auto-generated daily
   - Same code returned for same day

9. **Auto-mark absent after activity ends**
   - Run: `python manage.py mark_absent_students`
   - Students who didn't check in are marked absent

---

### Should Fail

1. **Student applies twice**

   ```
   Expected: 400 - "You have already applied to this activity."
   ```

2. **Student applies to closed activity**

   ```
   Expected: 400 - "This activity is not open for applications."
   ```

3. **Student applies to full activity**

   ```
   Expected: 400 - "This activity has reached maximum capacity."
   ```

4. **Organizer rejects without reason**

   ```json
   {
     "action": "reject"
   }
   Expected: 400 - "Rejection reason is required"
   ```

5. **Organizer rejects with reason > 225 chars**

   ```json
   {
     "action": "reject",
     "reason": "Very long text exceeding 225 characters..."
   }
   Expected: 400 - "Rejection reason cannot exceed 225 characters"
   ```

6. **Organizer reviews application from different org**

   ```
   Expected: 403 Forbidden or empty list
   ```

7. **Student tries to review application**

   ```
   Expected: 403 Forbidden
   ```

8. **Student checks in with wrong code**

   ```json
   {
     "code": "WRONG1"
   }
   Expected: 400 - "Invalid check-in code."
   ```

9. **Student checks in twice**

   ```
   Expected: 400 - "You have already checked in to this activity."
   ```

10. **Student checks in without approved application**

    ```
    Expected: 400 - "You must have an approved application to check in to this activity."
    ```

11. **Student checks in before activity starts**

    ```
    Expected: 400 - "This activity has not started yet."
    ```

12. **Student checks in after activity ends**
    ```
    Expected: 400 - "This activity has already ended."
    ```

---

## Common Issues

### Issue: 401 Unauthorized

- **Check:** Token is set in Authorization header
- **Fix:** Login again and save new token

### Issue: 403 Forbidden

- **Check:** Using correct role (student vs organizer)
- **Fix:** Login with appropriate account

### Issue: 400 "Activity is not open"

- **Check:** Activity status in database
- **Fix:** Update activity status to "open"

### Issue: Empty response on list

- **Check:** User has applications or permissions
- **Fix:** Create test application first

### Issue: "Invalid check-in code"

- **Check:** Code matches today's code exactly (case-insensitive)
- **Fix:** Get fresh code from `/checkin-code/` endpoint

### Issue: "Activity has not started yet"

- **Check:** Current time vs activity's `start_at`
- **Fix:** Wait until activity starts or update activity dates

---

## Check-in System Workflow ! NEW !

### For Organizers:

1. **Before Activity:** Get today's check-in code
   ```http
   GET /api/activities/1/checkin-code/
   ```
2. **During Activity:** Display code to students (e.g., on projector)
3. **After Activity:** View attendance records
   ```http
   GET /api/activities/1/checkin-list/
   ```

### For Students:

1. **Apply to Activity** (must be approved first)
2. **During Activity:** Enter the displayed code
   ```http
   POST /api/activities/1/checkin/
   ```
3. **Check Status:** Verify successful check-in
   ```http
   GET /api/activities/1/checkin-status/
   ```

### For Admins (via CLI):

**Mark absent students after activities end:**

```bash
# Mark students absent for activities that ended in last 7 days
python manage.py mark_absent_students

# Process activities from last 30 days
python manage.py mark_absent_students --days=30

# Dry run to see what would be marked
python manage.py mark_absent_students --dry-run
```

---

## Check-in System Features

### Key Features:

1. **Daily Code Generation**

   - Each activity gets one unique 6-digit code per day
   - Code format: 6 alphanumeric characters (e.g., "AN6813")
   - New code auto-generated at midnight (UTC)

2. **One-Time Check-in**

   - Students only need to check in once during entire activity
   - Duplicate check-ins are blocked
   - Check-in timestamp is recorded

3. **Automatic Absence Marking**

   - After activity ends, run management command
   - Students who didn't check in → marked "absent"
   - Students who checked in → marked "present"

4. **Validation Rules**
   - ✅ Must have approved application
   - ✅ Code must match today's code
   - ✅ Activity must be currently happening
   - ✅ No duplicate check-ins allowed

---

## Check-in Code Format

```
Format: 6 characters (uppercase letters + digits)
Examples: AN6813, X2Y9Z1, ABC123
Valid: A-Z, 0-9
Case-insensitive: "abc123" = "ABC123"
```
