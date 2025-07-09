# Noet Admin System Documentation

## Overview

The Noet Admin System provides comprehensive administrative capabilities for managing users, data, security, and system configuration. This documentation covers all admin features, safety guidelines, and best practices.

## Table of Contents

1. [Admin Access & Authentication](#admin-access--authentication)
2. [User Management](#user-management)
3. [Data Management](#data-management)
4. [Security Features](#security-features)
5. [Storage Configuration](#storage-configuration)
6. [Backup System](#backup-system)
7. [Safety Guidelines](#safety-guidelines)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## Admin Access & Authentication

### Initial Admin Setup

- **Default Admin Account**: `admin@example.com` / `admin123`
- **Admin Panel URL**: `http://localhost:3001` (login with admin credentials)
- **Admin Interface**: Accessible via "Admin" button in the top navigation

### Admin User Requirements

- Admin users have `isAdmin: true` in their user profile
- At least one admin user must exist at all times
- Admins cannot delete their own accounts
- Admins cannot remove admin privileges from the last admin user

---

## User Management

### User Operations Tab

The admin interface provides a dedicated "User Operations" tab with the following capabilities:

#### 1. User Selection & Overview

- **User Dropdown**: Search and select users by name or email
- **User Info Display**: Shows selected user's name, email, and account status
- **Real-time Updates**: User information updates immediately upon selection

#### 2. Destructive Operations

All destructive operations require typing "DELETE" for confirmation:

##### Clear Unknown Tags

- **Purpose**: Removes orphaned UUID tags from user's notes
- **Safety**: Non-destructive, only removes invalid tag references
- **Usage**: Select user → Click "Clear Unknown Tags" → Type "DELETE" → Confirm

##### Delete All Notes

- **Purpose**: Permanently removes all notes for the selected user
- **⚠️ WARNING**: This action cannot be undone
- **Backup**: Optional auto-backup before deletion (if enabled)
- **Usage**: Select user → Click "Delete All Notes" → Type "DELETE" → Confirm

##### Delete All Attachments

- **Purpose**: Removes all file attachments while preserving notes
- **⚠️ WARNING**: This action cannot be undone
- **Size Tracking**: Shows total storage freed after deletion
- **Usage**: Select user → Click "Delete All Attachments" → Type "DELETE" → Confirm

##### Delete All User Data

- **Purpose**: Complete user account and data wipe
- **⚠️ EXTREME WARNING**: This permanently deletes everything
- **Includes**: All notes, attachments, OTP settings, access history, and user account
- **Restrictions**: Cannot delete your own admin account
- **Usage**: Select user → Click "Delete All User Data" → Type "DELETE" → Confirm

#### 3. Bulk Operations

- **Multiple Selection**: Check boxes to select multiple operations
- **Simultaneous Execution**: Run multiple operations at once
- **Progress Tracking**: Real-time progress updates for each operation
- **Detailed Results**: Summary of all operations performed

#### 4. User Account Management

##### Create New User

- **Required Fields**: Name, email, password
- **Optional Fields**: Admin privileges
- **Email Validation**: Prevents duplicate emails
- **Password Requirements**: Minimum 6 characters

##### Edit User Information

- **Editable Fields**: Name, email, admin status
- **Validation**: Prevents empty fields and duplicate emails
- **Restrictions**: Cannot remove admin status from last admin

##### Enable/Disable Users

- **Purpose**: Temporarily disable user accounts
- **Effect**: Prevents login while preserving data
- **Reversible**: Users can be re-enabled at any time

##### Reset User Password

- **Admin Override**: Reset passwords without knowing current password
- **Security**: Forces password change on next login
- **Logging**: All password resets are logged in access history

---

## Data Management

### Storage Configuration

#### Global Storage Location

- **Current Path**: Displays current notes storage directory
- **Change Location**: Set storage path outside app directory
- **Validation**: Real-time path validation and permissions checking
- **Safety**: Prevents invalid or inaccessible paths

#### Disk Usage Monitoring

- **Per-User Breakdown**: Shows disk usage for each user
- **Detailed Metrics**: Notes count, attachments count, total size
- **System Totals**: Overall storage usage across all users
- **Manual Refresh**: Point-in-time data with manual refresh button
- **Last Updated**: Timestamp of last usage calculation

### Data Import/Export

#### Evernote Import

- **Format Support**: `.enex` files
- **Batch Processing**: Multiple notes in single file
- **Metadata Preservation**: Maintains creation dates, tags, attachments
- **Progress Tracking**: Real-time import progress

#### Backup Integration

- **Pre-Operation Backups**: Automatic backups before destructive operations
- **Configurable**: Enable/disable per operation type
- **Storage Location**: Configurable backup directory

---

## Security Features

### Two-Factor Authentication (2FA/OTP)

#### Admin OTP Controls

- **Enable OTP**: Generate QR code and backup codes for any user
- **Disable OTP**: Remove 2FA requirement for users
- **Reset OTP**: Generate new secret and backup codes
- **Force Enable**: Override existing OTP settings

#### OTP Implementation Details

- **Secret Generation**: 32-character base32 secrets
- **QR Code**: Automatic QR code generation for authenticator apps
- **Backup Codes**: 10 unique 8-digit backup codes per user
- **Compatibility**: Works with Google Authenticator, Authy, etc.

### Access History

#### Security Event Tracking

- **Event Types**: Login, logout, password changes, OTP events, admin actions
- **Detailed Information**: IP addresses, user agents, timestamps
- **Success/Failure Tracking**: Logs both successful and failed attempts
- **Pagination**: Efficient handling of large history logs

#### Admin Action Logging

- **Comprehensive Tracking**: All admin operations are logged
- **Audit Trail**: Complete record of administrative actions
- **User Association**: Links admin actions to specific user accounts
- **Compliance**: Supports security auditing and compliance requirements

---

## Storage Configuration

### Storage Location Settings

#### Path Configuration

- **Current Location**: `~/noet-app/notes` (default)
- **Custom Paths**: Support for paths outside application directory
- **Validation**: Real-time path validation and accessibility checks
- **Permissions**: Ensures read/write access to specified directories

#### Migration Support

- **Path Changes**: Seamless migration to new storage locations
- **Data Integrity**: Validates data integrity during migration
- **Rollback**: Ability to revert to previous storage location

---

## Backup System

### Backup Configuration

#### Auto-Backup Settings

- **Enable Auto-Backup**: Global toggle for automatic backups
- **Backup Before Destruction**: Automatic backups before destructive operations
- **Max Backups Per User**: Configurable retention limits
- **Backup Location**: Configurable backup directory

#### Backup Types

- **Manual Backups**: On-demand backup creation
- **Automatic Backups**: Triggered by destructive operations
- **Incremental Backups**: Efficient storage of changes
- **Full Backups**: Complete user data snapshots

### Backup Management

#### Backup Creation

- **User-Specific**: Individual user data backups
- **System-Wide**: Complete application data backups
- **Metadata Inclusion**: Preserves all user metadata and settings
- **Compression**: Efficient storage using ZIP compression

#### Backup Restoration

- **Selective Restoration**: Restore specific users or data types
- **Merge Mode**: Combine backup data with existing data
- **Validation**: Integrity checks before restoration
- **Progress Tracking**: Real-time restoration progress

---

## Safety Guidelines

### ⚠️ Critical Safety Warnings

#### Destructive Operations

1. **Always Verify User Selection**: Double-check selected user before operations
2. **Enable Auto-Backup**: Configure backups before performing destructive operations
3. **Test in Development**: Test all operations in non-production environment
4. **Have Recovery Plan**: Maintain external backups for critical data

#### User Management

1. **Admin Account Security**: Never delete the last admin account
2. **Password Management**: Use strong passwords for admin accounts
3. **OTP Backup**: Securely store OTP backup codes
4. **Access Review**: Regularly review admin access permissions

#### Data Management

1. **Storage Validation**: Always validate storage paths before changes
2. **Backup Verification**: Verify backup integrity before destructive operations
3. **Disk Space**: Monitor disk usage to prevent storage issues
4. **Data Retention**: Implement appropriate data retention policies

### Best Practices

#### Security

- Enable 2FA for all admin accounts
- Regularly review access history logs
- Use strong, unique passwords
- Monitor failed login attempts
- Keep backup codes secure and accessible

#### Data Management

- Perform regular system backups
- Monitor disk usage trends
- Validate storage paths before changes
- Test backup/restore procedures
- Document all major administrative actions

#### User Management

- Communicate with users before major changes
- Provide advance notice for account changes
- Maintain accurate user information
- Follow organizational policies for user lifecycle

---

## API Reference

### Admin Authentication

All admin endpoints require authentication via Bearer token:

```
Authorization: Bearer <admin-user-id>
```

### User Management Endpoints

#### Get All Users

```
GET /api/admin/users
```

Returns list of all users with basic information.

#### Create User

```
POST /api/admin/users
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "isAdmin": false
}
```

#### Update User

```
PUT /api/admin/users/:userId
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "isAdmin": true
}
```

#### Delete User

```
DELETE /api/admin/users/:userId
```

### Data Management Endpoints

#### Clear Unknown Tags

```
POST /api/admin/users/:userId/clear-unknown-tags
```

#### Delete All Notes

```
DELETE /api/admin/users/:userId/delete-all-notes
```

#### Delete All Attachments

```
DELETE /api/admin/users/:userId/delete-all-attachments
```

#### Delete All User Data

```
DELETE /api/admin/users/:userId/delete-all-data
```

### Security Endpoints

#### Enable OTP

```
POST /api/admin/users/:userId/enable-otp
Content-Type: application/json

{
  "force": false
}
```

#### Disable OTP

```
POST /api/admin/users/:userId/disable-otp
```

#### Reset OTP

```
POST /api/admin/users/:userId/reset-otp
```

#### Get Access History

```
GET /api/admin/users/:userId/access-history?limit=100&offset=0
```

### Storage Management Endpoints

#### Get Storage Info

```
GET /api/admin/storage
```

#### Update Storage Location

```
POST /api/admin/storage/location
Content-Type: application/json

{
  "location": "/path/to/new/storage"
}
```

#### Validate Storage Path

```
POST /api/admin/storage/validate
Content-Type: application/json

{
  "path": "/path/to/validate"
}
```

### Backup System Endpoints

#### Get Backup Configuration

```
GET /api/admin/backup-config
```

#### Update Backup Configuration

```
PUT /api/admin/backup-config
Content-Type: application/json

{
  "enableAutoBackup": true,
  "backupBeforeDestruction": true,
  "maxBackupsPerUser": 10,
  "backupLocation": "backups"
}
```

#### Create Backup

```
POST /api/admin/backup
Content-Type: application/json

{
  "userId": "user-id",
  "backupType": "manual",
  "maxBackups": 10,
  "location": "backups"
}
```

---

## Troubleshooting

### Common Issues

#### Server Startup Errors

**Problem**: Missing dependencies (speakeasy, qrcode)
**Solution**: Run `npm install speakeasy qrcode` in project root

#### Port Conflicts

**Problem**: Ports 3001 or 3004 already in use
**Solution**: Kill existing processes: `lsof -ti:3001 | xargs kill -9`

#### Authentication Errors

**Problem**: Admin access denied
**Solution**: Verify user has `isAdmin: true` in users.json

#### Storage Path Errors

**Problem**: Invalid storage location
**Solution**: Ensure path exists and has read/write permissions

### Performance Issues

#### Slow Disk Usage Loading

**Problem**: Large number of users/files
**Solution**: Use manual refresh and optimize during off-peak hours

#### Memory Usage

**Problem**: High memory consumption
**Solution**: Restart server periodically and monitor resource usage

### Data Issues

#### Missing Backups

**Problem**: No backups created before destructive operations
**Solution**: Enable auto-backup in backup configuration

#### OTP Issues

**Problem**: Users unable to authenticate with OTP
**Solution**: Use admin reset OTP function to generate new codes

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review access history logs
2. **Monthly**: Check disk usage and clean up old backups
3. **Quarterly**: Audit user accounts and permissions
4. **Annually**: Review and update security procedures

### Support Resources

- **Admin Interface**: Primary management interface
- **API Documentation**: Complete endpoint reference
- **Log Files**: Server logs for troubleshooting
- **Test Suite**: Comprehensive testing framework

### Contact Information

For additional support or questions about the admin system:

- **Documentation**: This file and other docs in `/docs` directory
- **Test Suite**: Run comprehensive tests with `npm run test-comprehensive`
- **Health Check**: Monitor system health at `/api/health`

---

## Changelog

### Version 1.0.0

- Initial admin system implementation
- Complete user management features
- Data management capabilities
- Security features (OTP, access history)
- Storage configuration system
- Backup system with auto-backup
- Comprehensive API endpoints
- Safety confirmations and warnings

---

_Last Updated: July 2025_
_Version: 1.0.0_
_Author: Sam Gallant_
