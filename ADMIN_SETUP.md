# VibeChat Admin System Configuration

## For Production Admin Setup

Add to your `.env` file on the backend:

```
# OPTIONAL: For additional admin email verification
ADMIN_EMAIL=your-admin-email@example.com
```

## How Admin System Works

### Backend Security
1. Admin middleware (`adminMiddleware.js`) verifies:
   - Valid JWT token
   - User exists in database
   - User has `isAdmin: true` flag
   - (Optional) User email matches ADMIN_EMAIL

2. If any check fails: **403 Forbidden** response

### Frontend Security
1. ProtectedAdminRoute component verifies:
   - User is authenticated
   - User has `isAdmin: true` flag
   - If not: shows "Access Denied" and redirects

### Setting Up Admin User

To make a user an admin:

**Option 1: Database Update (Direct)**
```javascript
// Connect to MongoDB and run:
db.users.updateOne({ email: "admin@example.com" }, { $set: { isAdmin: true } })
```

**Option 2: Admin API (If admin exists)**
```bash
curl -X PUT http://localhost:5000/api/admin/users/{userId}/toggle-admin \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json"
```

## Admin Access

Hidden at: `/admin`

Example: `https://vibe-chat-lake.vercel.app/admin`

**No UI entry point** - users cannot discover it

## Admin Features

- User statistics
- User management
- Activity monitoring
- Room management
- System status

## Security Notes

✅ Admin routes protected with middleware
✅ Normal users cannot access admin APIs
✅ Admin dashboard hidden from UI
✅ JWT token verified on every admin request
✅ Email verification optional but recommended
✅ Proper 403 Forbidden responses

⚠️ DO NOT expose admin email in frontend code
⚠️ DO NOT add admin navigation to public UI
⚠️ DO NOT log admin credentials
