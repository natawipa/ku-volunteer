# Postman Quick Reference - Application System

## 🔐 Authentication

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

## 👨‍🎓 Student Endpoints

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

### 🆕 Get My Approved Activities

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

### 🆕 Browse Activities with Application Status

```http
GET http://localhost:8000/api/activities/list/
Authorization: Bearer YOUR_STUDENT_TOKEN
```

**New Feature:** Each activity now includes `user_application_status` field!

**Response Example:**

```json
[
  {
    "id": 1,
    "title": "Beach Cleanup",
    "user_application_status": "approved" // 👈 NEW!
    // ... other fields
  },
  {
    "id": 2,
    "title": "Tree Planting",
    "user_application_status": "pending" // 👈 Shows status!
    // ... other fields
  },
  {
    "id": 3,
    "title": "Food Drive",
    "user_application_status": null // 👈 Not applied yet
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

## 👔 Organizer Endpoints

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

## 🧪 Test Cases

### ✅ Should Succeed

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

5. **🆕 Student fetches approved activities**

   - Returns only activities where application is approved
   - Empty array if no approved applications

6. **🆕 Activity list shows application status**
   - Each activity includes `user_application_status` field
   - Shows current status: pending/approved/rejected/cancelled/null

---

### ❌ Should Fail

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

---

## 📝 Postman Collection Variables

Set these in your collection:

| Variable            | Value                   | Usage                |
| ------------------- | ----------------------- | -------------------- |
| `baseUrl`           | `http://localhost:8000` | Base API URL         |
| `studentToken`      | `eyJ0eXAiOi...`         | Student auth token   |
| `organizerToken`    | `eyJ0eXAiOi...`         | Organizer auth token |
| `adminToken`        | `eyJ0eXAiOi...`         | Admin auth token     |
| `testActivityId`    | `1`                     | Test activity ID     |
| `testApplicationId` | `1`                     | Test application ID  |

---

## 🎯 Auto-Save Token Script

Add this to the **Tests** tab of your login requests:

```javascript
if (pm.response.code === 200) {
  const jsonData = pm.response.json();
  pm.collectionVariables.set("token", jsonData.access);
  console.log("✅ Token saved!");
}
```

Then use `{{token}}` in your Authorization headers.

---

## 🔍 Response Status Codes

| Code | Meaning      | When                             |
| ---- | ------------ | -------------------------------- |
| 200  | OK           | Successful GET, review, cancel   |
| 201  | Created      | Application created successfully |
| 400  | Bad Request  | Validation error                 |
| 401  | Unauthorized | Missing or invalid token         |
| 403  | Forbidden    | Wrong role or permissions        |
| 404  | Not Found    | Application/Activity not found   |

---

## 📋 Complete Test Flow

1. **Setup:**

   ```
   Login as Student → Save token
   Login as Organizer → Save token
   ```

2. **🆕 Browse Activities (Student):**

   ```
   GET /api/activities/list/ → Check user_application_status for each activity
   → Activities with null status = can apply
   → Activities with "pending" = waiting for review
   → Activities with "approved" = already registered
   ```

3. **Student Flow:**

   ```
   Create Application → Check status: "pending"
   List Applications → Verify application appears
   GET /api/activities/1/ → Verify user_application_status = "pending"
   ```

4. **Organizer Flow:**

   ```
   List Applications for Activity → See pending applications
   Approve Application → Check status: "approved"
   ```

5. **🆕 Student Verification:**

   ```
   List Applications → Verify status changed to "approved"
   GET /api/activities/1/ → Verify user_application_status = "approved"
   GET /api/activities/my-approved-activities/ → See approved activity in list
   ```

6. **Rejection Flow:**

   ```
   (New Application) Create → Pending
   Organizer Reject with reason → Status: "rejected"
   Student views → See rejection reason in notes
   GET /api/activities/1/ → Verify user_application_status = "rejected"
   ```

7. **Cancellation Flow:**
   ```
   Create Application → Pending
   Cancel Application → Status: "cancelled"
   GET /api/activities/1/ → Verify user_application_status = "cancelled"
   ```

---

## 🐛 Common Issues

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

---

## 💡 Tips

1. **Use Environments** for different servers (dev/staging/prod)
2. **Save tokens as variables** to avoid copy-paste
3. **Create test data** before running tests
4. **Use pre-request scripts** to setup test conditions
5. **Chain requests** using variables from previous responses
6. **🆕 Check `user_application_status`** in activity responses to show UI badges
7. **🆕 Use `/my-approved-activities/`** for "My Activities" page instead of filtering manually

---

## 🚀 Import This Collection

Save this as a Postman collection JSON:

```json
{
  "info": {
    "name": "KU Volunteer - Applications",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"student@test.com\",\n  \"password\": \"testpass123\"\n}"
        },
        "url": "{{baseUrl}}/api/users/login/"
      }
    },
    {
      "name": "Create Application",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"activity\": 1\n}"
        },
        "url": "{{baseUrl}}/api/activities/applications/create/"
      }
    },
    {
      "name": "Get My Approved Activities",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": "{{baseUrl}}/api/activities/my-approved-activities/"
      }
    },
    {
      "name": "Browse Activities (with status)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": "{{baseUrl}}/api/activities/list/"
      }
    }
  ]
}
```
