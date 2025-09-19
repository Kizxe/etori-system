# Admin-Only User Management System

This document describes the admin-only user management system implemented for the inventory management application.

## Overview

The system allows administrators to manage users without allowing self-registration. All user accounts must be created by administrators through the admin panel.

## Features

### Admin Panel (User Management Page)
- **Location**: `/admin/users`
- **Access**: Admin role only
- **Features**:
  - View all users with their details
  - Add new users (with invitation or direct creation)
  - Edit user information and roles
  - Reset user passwords
  - Deactivate user accounts
  - Manage pending invitations

### User Creation Flow
1. Admin logs into the system
2. Navigates to User Management page
3. Clicks "Add User" button
4. Fills in user details:
   - Name
   - Email
   - Role (Admin/Staff)
   - Department (optional)
5. Chooses between:
   - **Send Invitation**: Creates invitation with 48-hour expiration
   - **Create Directly**: Creates user with temporary password

### Invitation System
- **Expiration**: Invitations expire after 48 hours
- **Security**: Each invitation has a unique token
- **Acceptance**: Users click invitation link to set their password
- **Status Tracking**: Track invitation status (pending, used, expired)

### Role-Based Access Control
- **Admin Role**: Full access to user management
- **Staff Role**: Standard user access only
- **Middleware**: API endpoints protected by role-based middleware

## Database Schema

### User Model Updates
```prisma
model User {
  id                String         @id @default(cuid())
  name              String
  email             String         @unique
  password          String?        // Made optional for invitations
  role              Role           @default(STAFF)
  department        String?
  isActive          Boolean        @default(true)  // New field
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  preferences       Json?
  // ... other fields
  invitations       UserInvitation[] @relation("InvitedBy")
  invitedBy         UserInvitation? @relation("InvitedUser")
}
```

### UserInvitation Model
```prisma
model UserInvitation {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String
  role        Role      @default(STAFF)
  department  String?
  token       String    @unique
  expiresAt   DateTime
  isUsed      Boolean   @default(false)
  invitedById String
  invitedBy   User      @relation("InvitedBy", fields: [invitedById], references: [id])
  invitedUserId String? @unique
  invitedUser User?     @relation("InvitedUser", fields: [invitedUserId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## API Endpoints

### Admin User Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user or invitation
- `GET /api/admin/users/[id]` - Get specific user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Deactivate user
- `POST /api/admin/users/[id]/reset-password` - Reset user password

### Invitation Management
- `GET /api/admin/invitations` - Get all invitations
- `DELETE /api/admin/invitations` - Cancel invitation
- `POST /api/admin/cleanup-expired-invitations` - Clean up expired invitations

### Invitation Acceptance
- `GET /api/auth/accept-invitation?token=xxx` - Get invitation details
- `POST /api/auth/accept-invitation` - Accept invitation and create account

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 12
- Temporary passwords are generated using cryptographically secure random bytes
- Password validation (minimum 8 characters)

### Invitation Security
- Unique tokens generated using crypto.randomBytes
- 48-hour expiration time
- One-time use only
- Email validation

### Access Control
- All admin endpoints require authentication
- Role-based authorization (Admin only)
- User status checking (active/inactive)
- Self-deletion prevention

## User Interface

### Admin Dashboard
- **User List**: Table view with user details, roles, and status
- **Invitation List**: Table view with invitation status and expiration
- **Add User Dialog**: Form for creating new users or invitations
- **Edit User Dialog**: Form for updating user information
- **Action Buttons**: Edit, reset password, deactivate users

### Invitation Acceptance Page
- **Location**: `/auth/accept-invitation?token=xxx`
- **Features**:
  - Display invitation details
  - Password creation form
  - Expiration status checking
  - Error handling for invalid/expired invitations

## Usage Instructions

### For Administrators

1. **Adding a New User**:
   - Go to Admin → User Management
   - Click "Add User"
   - Fill in user details
   - Choose invitation or direct creation
   - Submit form

2. **Managing Users**:
   - View all users in the Users tab
   - Edit user information using the edit button
   - Reset passwords using the key button
   - Deactivate users using the trash button

3. **Managing Invitations**:
   - View all invitations in the Invitations tab
   - Cancel pending invitations
   - Monitor invitation status and expiration

### For Invited Users

1. **Accepting an Invitation**:
   - Click the invitation link in the email
   - Review account details
   - Create a password
   - Submit the form
   - Login with new credentials

## Future Enhancements

### Email Integration
- Send invitation emails automatically
- Send password reset emails
- Email notifications for account changes

### Advanced Features
- Bulk user operations
- User import/export
- Advanced user search and filtering
- Audit logging for user management actions
- Custom invitation expiration times
- User groups and permissions

### Monitoring
- Invitation usage analytics
- User activity tracking
- Security event logging

## Configuration

### Environment Variables
- `NEXTAUTH_URL`: Base URL for invitation links
- `DATABASE_URL`: Database connection string

### Invitation Settings
- Default expiration: 48 hours
- Token length: 32 bytes (64 hex characters)
- Password requirements: Minimum 8 characters

## Troubleshooting

### Common Issues
1. **Invitation not working**: Check if invitation is expired or already used
2. **Cannot access admin panel**: Verify user has ADMIN role
3. **Password reset not working**: Check if user account is active
4. **Email not received**: Check email configuration and spam folder

### Error Messages
- "Invalid invitation token": Token is invalid or expired
- "Invitation has already been used": Token was already used
- "User with this email already exists": Email is already registered
- "Forbidden": User doesn't have admin permissions
- "Cannot delete your own account": Self-deletion prevention
