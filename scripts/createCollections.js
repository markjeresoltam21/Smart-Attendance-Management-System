// Firestore Collection Initializer
// This script creates the initial structure for Firestore collections
// Run with: node scripts/createCollections.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key)
// For now, we'll create the structure through the app itself

/**
 * Collection Structure Guide for Manual Setup
 * ============================================
 * 
 * Since Firebase Admin SDK requires a service account key,
 * we'll create collections through the app when data is first added.
 * 
 * This file documents the exact structure needed.
 */

const collectionStructures = {
  users: {
    description: 'User accounts collection',
    documentIdPattern: '{Firebase Auth UID}',
    sampleDocumentId: 'abc123def456',
    fields: {
      uid: {
        type: 'string',
        required: true,
        example: 'abc123def456',
        description: 'Firebase Authentication UID'
      },
      email: {
        type: 'string',
        required: true,
        example: 'john.doe@company.com',
        description: 'User email address'
      },
      fullName: {
        type: 'string',
        required: true,
        example: 'John Doe',
        description: 'Full name of the user'
      },
      role: {
        type: 'string',
        required: true,
        enum: ['admin', 'client'],
        default: 'client',
        example: 'client',
        description: 'User role for access control'
      },
      employeeId: {
        type: 'string',
        required: true,
        example: 'EMP001',
        description: 'Unique employee identifier'
      },
      department: {
        type: 'string',
        required: false,
        example: 'IT Department',
        description: 'Department name (optional)'
      },
      phone: {
        type: 'string',
        required: false,
        example: '+1234567890',
        description: 'Phone number (optional)'
      },
      isActive: {
        type: 'boolean',
        required: true,
        default: true,
        example: true,
        description: 'Account active status'
      },
      createdAt: {
        type: 'timestamp',
        required: true,
        example: new Date().toISOString(),
        description: 'Account creation timestamp'
      },
      updatedAt: {
        type: 'timestamp',
        required: false,
        example: new Date().toISOString(),
        description: 'Last update timestamp'
      }
    }
  },

  attendance: {
    description: 'Daily attendance records',
    documentIdPattern: '{userId}_{date}',
    sampleDocumentId: 'abc123def456_2025-11-10',
    fields: {
      userId: {
        type: 'string',
        required: true,
        example: 'abc123def456',
        description: 'Reference to user document'
      },
      userName: {
        type: 'string',
        required: true,
        example: 'John Doe',
        description: 'User full name (denormalized)'
      },
      employeeId: {
        type: 'string',
        required: false,
        example: 'EMP001',
        description: 'Employee ID (denormalized)'
      },
      status: {
        type: 'string',
        required: true,
        enum: ['present', 'absent', 'late', 'leave'],
        default: 'present',
        example: 'present',
        description: 'Attendance status'
      },
      date: {
        type: 'string',
        required: true,
        format: 'YYYY-MM-DD',
        example: '2025-11-10',
        description: 'Date of attendance'
      },
      checkInTime: {
        type: 'string',
        required: true,
        format: 'HH:MM:SS AM/PM',
        example: '09:15:30 AM',
        description: 'Check-in time'
      },
      checkOutTime: {
        type: 'string',
        required: false,
        format: 'HH:MM:SS AM/PM',
        example: '05:30:00 PM',
        description: 'Check-out time (optional)'
      },
      timestamp: {
        type: 'timestamp',
        required: true,
        example: new Date().toISOString(),
        description: 'Full timestamp of check-in'
      },
      notes: {
        type: 'string',
        required: false,
        example: 'Late due to traffic',
        description: 'Additional notes'
      },
      location: {
        type: 'object',
        required: false,
        example: { latitude: 0, longitude: 0 },
        description: 'GPS coordinates (optional)'
      },
      createdAt: {
        type: 'timestamp',
        required: true,
        example: new Date().toISOString(),
        description: 'Record creation timestamp'
      },
      updatedAt: {
        type: 'timestamp',
        required: false,
        example: new Date().toISOString(),
        description: 'Last update timestamp'
      },
      updatedBy: {
        type: 'string',
        required: false,
        example: 'admin_uid_123',
        description: 'UID of admin who updated'
      }
    }
  }
};

// Export for reference
module.exports = collectionStructures;

// Display structure
console.log('\n📊 FIRESTORE COLLECTIONS STRUCTURE\n');
console.log('Collections will be auto-created when you add the first document.');
console.log('Use the app to register a user - this will create the "users" collection.');
console.log('Mark attendance - this will create the "attendance" collection.\n');

Object.keys(collectionStructures).forEach(collectionName => {
  const collection = collectionStructures[collectionName];
  console.log(`\n✅ Collection: ${collectionName}`);
  console.log(`   Description: ${collection.description}`);
  console.log(`   Document ID Pattern: ${collection.documentIdPattern}`);
  console.log(`   Sample ID: ${collection.sampleDocumentId}\n`);
  
  console.log('   Fields:');
  Object.keys(collection.fields).forEach(fieldName => {
    const field = collection.fields[fieldName];
    const required = field.required ? '(required)' : '(optional)';
    console.log(`   - ${fieldName}: ${field.type} ${required}`);
  });
});

console.log('\n\n🎯 COLLECTIONS ARE AUTO-CREATED!\n');
console.log('No manual migration needed. Collections appear automatically when:');
console.log('1. Register first user → "users" collection created');
console.log('2. Mark first attendance → "attendance" collection created\n');
