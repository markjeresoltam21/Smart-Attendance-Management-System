// Firestore Database Schema Definition
// This file defines all collections and their structure

/**
 * FIRESTORE DATABASE STRUCTURE
 * =============================
 * 
 * Collections:
 * 1. users - User accounts (Admin & Clients)
 * 2. attendance - Attendance records
 * 3. settings - App configuration (optional)
 * 4. departments - Departments/divisions (optional for future)
 */

// ============================================
// COLLECTION: users
// ============================================
const usersSchema = {
  collectionName: 'users',
  description: 'Stores all user accounts (Admin and Client)',
  indexes: [
    { field: 'email', order: 'asc' },
    { field: 'role', order: 'asc' },
    { field: 'employeeId', order: 'asc' },
    { field: 'createdAt', order: 'desc' }
  ],
  documentStructure: {
    // Auto-generated document ID = Firebase Auth UID
    uid: {
      type: 'string',
      required: true,
      description: 'Firebase Auth user ID'
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      description: 'User email address'
    },
    fullName: {
      type: 'string',
      required: true,
      description: 'Full name of the user'
    },
    role: {
      type: 'string',
      required: true,
      enum: ['admin', 'client'],
      default: 'client',
      description: 'User role for access control'
    },
    employeeId: {
      type: 'string',
      required: true,
      unique: true,
      description: 'Unique employee identifier'
    },
    department: {
      type: 'string',
      required: false,
      description: 'Department name (optional)'
    },
    phone: {
      type: 'string',
      required: false,
      description: 'Contact phone number (optional)'
    },
    isActive: {
      type: 'boolean',
      required: true,
      default: true,
      description: 'Account status (active/inactive)'
    },
    createdAt: {
      type: 'string', // ISO 8601 format
      required: true,
      description: 'Account creation timestamp'
    },
    updatedAt: {
      type: 'string',
      required: false,
      description: 'Last update timestamp'
    }
  },
  exampleDocument: {
    uid: 'abc123xyz789',
    email: 'john.doe@company.com',
    fullName: 'John Doe',
    role: 'client',
    employeeId: 'EMP001',
    department: 'IT',
    phone: '+1234567890',
    isActive: true,
    createdAt: '2025-11-10T08:00:00.000Z',
    updatedAt: '2025-11-10T08:00:00.000Z'
  }
};

// ============================================
// COLLECTION: attendance
// ============================================
const attendanceSchema = {
  collectionName: 'attendance',
  description: 'Stores daily attendance records',
  indexes: [
    { field: 'userId', order: 'asc' },
    { field: 'date', order: 'desc' },
    { field: 'status', order: 'asc' },
    { field: 'createdAt', order: 'desc' }
  ],
  compositeIndexes: [
    { fields: ['userId', 'date'], order: ['asc', 'desc'] }
  ],
  documentStructure: {
    // Auto-generated document ID = {userId}_{date} (e.g., abc123_2025-11-10)
    userId: {
      type: 'string',
      required: true,
      reference: 'users/{userId}',
      description: 'Reference to user who marked attendance'
    },
    userName: {
      type: 'string',
      required: true,
      description: 'User full name (denormalized for quick access)'
    },
    employeeId: {
      type: 'string',
      required: false,
      description: 'Employee ID (denormalized)'
    },
    status: {
      type: 'string',
      required: true,
      enum: ['present', 'absent', 'late', 'leave'],
      default: 'present',
      description: 'Attendance status'
    },
    date: {
      type: 'string', // Format: YYYY-MM-DD
      required: true,
      description: 'Date of attendance'
    },
    checkInTime: {
      type: 'string', // Format: HH:MM:SS AM/PM
      required: true,
      description: 'Time when attendance was marked'
    },
    checkOutTime: {
      type: 'string',
      required: false,
      description: 'Time when user checked out (optional)'
    },
    timestamp: {
      type: 'string', // ISO 8601 format
      required: true,
      description: 'Full timestamp of check-in'
    },
    notes: {
      type: 'string',
      required: false,
      description: 'Additional notes or remarks'
    },
    location: {
      type: 'object',
      required: false,
      description: 'GPS location (optional for future)',
      properties: {
        latitude: 'number',
        longitude: 'number'
      }
    },
    createdAt: {
      type: 'string',
      required: true,
      description: 'Record creation timestamp'
    },
    updatedAt: {
      type: 'string',
      required: false,
      description: 'Last update timestamp'
    },
    updatedBy: {
      type: 'string',
      required: false,
      description: 'UID of user who last updated (for admin edits)'
    }
  },
  exampleDocument: {
    userId: 'abc123xyz789',
    userName: 'John Doe',
    employeeId: 'EMP001',
    status: 'present',
    date: '2025-11-10',
    checkInTime: '09:15:30 AM',
    checkOutTime: null,
    timestamp: '2025-11-10T09:15:30.000Z',
    notes: '',
    location: null,
    createdAt: '2025-11-10T09:15:30.000Z',
    updatedAt: null,
    updatedBy: null
  }
};

// ============================================
// COLLECTION: settings (Optional)
// ============================================
const settingsSchema = {
  collectionName: 'settings',
  description: 'App-wide configuration settings',
  documentStructure: {
    // Document ID: 'app_config'
    organizationName: {
      type: 'string',
      description: 'Organization/company name'
    },
    workingHours: {
      type: 'object',
      properties: {
        start: 'string', // e.g., "09:00"
        end: 'string'    // e.g., "17:00"
      }
    },
    lateThreshold: {
      type: 'number',
      description: 'Minutes after which marked as late'
    },
    requireLocation: {
      type: 'boolean',
      description: 'Whether GPS location is required'
    }
  },
  exampleDocument: {
    organizationName: 'Smart Company Inc.',
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    lateThreshold: 15,
    requireLocation: false
  }
};

// ============================================
// EXPORT SCHEMAS
// ============================================
module.exports = {
  users: usersSchema,
  attendance: attendanceSchema,
  settings: settingsSchema,
  
  // All collections list
  collections: ['users', 'attendance', 'settings'],
  
  // Status enums
  enums: {
    userRoles: ['admin', 'client'],
    attendanceStatus: ['present', 'absent', 'late', 'leave']
  }
};
