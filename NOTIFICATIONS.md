# Push Notifications Implementation

## ⚠️ IMPORTANT: Development Build Required (SDK 53+)

> **Note**: Starting with Expo SDK 53, push notifications (remote notifications) are **no longer supported in Expo Go**. You must use a **development build** to test and use push notifications.

### Why This Change?
Expo removed push notification functionality from Expo Go to reduce app size and improve performance. Local notifications still work, but for full push notification features, you need a development build.

### How to Create a Development Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
eas build:configure

# Create a development build for Android
eas build --profile development --platform android

# Create a development build for iOS
eas build --profile development --platform ios
```

For more information: [Expo Development Builds Documentation](https://docs.expo.dev/develop/development-builds/introduction/)

---

## Overview
This document describes the push notification system implemented for the Smart Attendance Management System (SAMS). The system uses `expo-notifications` to deliver attendance reminders to users.

## Features

### 1. **Daily Attendance Reminders**
- Scheduled for **9:00 AM every day**
- Repeating local notification
- Reminds users to mark their attendance
- Works offline (local notifications)

### 2. **Instant Confirmation Notifications**
- Sent immediately when user marks attendance
- Provides visual feedback for successful actions
- Icon: ✅ with success message

### 3. **Permission Management**
- Automatic permission request on app load
- Graceful handling of denied permissions
- Push token saved to Firestore for future use

### 4. **Logout Cleanup**
- All scheduled notifications cancelled on logout
- Prevents reminders for logged-out users

## File Structure

```
src/services/notificationService.js    - Core notification logic
src/screens/ClientDashboard.js         - Integration & setup
app.json                                - Expo configuration
scripts/testNotifications.js           - Testing guide
```

## Implementation Details

### notificationService.js Functions

#### `registerForPushNotifications()`
- Requests notification permissions (iOS/Android)
- Retrieves Expo push token
- Configures Android notification channel
- Returns: `{ success, token }`

#### `scheduleAttendanceReminder()`
- Cancels existing scheduled notifications
- Schedules daily reminder at 9:00 AM
- Uses repeating trigger
- Returns: `{ success }`

#### `sendImmediateNotification(title, body)`
- Sends notification immediately
- Used for instant feedback
- Parameters: title and body text
- Returns: `{ success }`

#### `cancelAllNotifications()`
- Cancels all scheduled notifications
- Called on logout
- Returns: `{ success }`

#### `savePushToken(userId, token)`
- Saves push token to Firestore
- Stored in user document
- Includes timestamp
- Returns: `{ success }`

#### `checkAndSendAttendanceReminder(userId, userName)`
- Checks if attendance marked today
- Sends reminder if not marked
- Can be used with cron jobs
- Returns: `{ success, reminderSent }`

### ClientDashboard.js Integration

```javascript
// Setup on component mount
useEffect(() => {
  loadData();
  setupNotifications();
}, []);

// Request permissions & schedule reminders
const setupNotifications = async () => {
  const permissionResult = await notificationService.registerForPushNotifications();
  if (permissionResult.success) {
    await notificationService.savePushToken(user.uid, permissionResult.token);
    await notificationService.scheduleAttendanceReminder();
  }
};

// Confirm attendance marking
const handleMarkAttendance = async () => {
  const result = await markAttendance(user.uid, userData.fullName, 'present');
  if (result.success) {
    await notificationService.sendImmediateNotification(
      '✅ Attendance Marked',
      'Your attendance has been successfully recorded for today!'
    );
  }
};

// Cleanup on logout
const handleLogout = async () => {
  await notificationService.cancelAllNotifications();
  await logoutUser();
};
```

## Configuration (app.json)

### Android Permissions
```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.POST_NOTIFICATIONS"
]
```

### Notification Plugin
```json
"plugins": [
  [
    "expo-notifications",
    {
      "icon": "./assets/images/logo.png",
      "color": "#4A90E2",
      "sounds": [],
      "mode": "production"
    }
  ]
]
```

### Notification Settings
```json
"notification": {
  "icon": "./assets/images/logo.png",
  "color": "#4A90E2",
  "androidMode": "default",
  "androidCollapsedTitle": "Smart Attendance"
}
```

## Testing Instructions

### ⚠️ Important: Testing with Development Builds
Since push notifications require a development build (not Expo Go) for SDK 53+:

**Option 1: Local Notifications (Works in Expo Go)**
- Daily reminders use **local notifications**
- These work in Expo Go and don't require development builds
- No internet connection needed

**Option 2: Development Build (Full Features)**
```bash
# Build for Android
eas build --profile development --platform android

# Build for iOS  
eas build --profile development --platform ios

# Install on device and test
```

### Development Testing
1. Start the app: `npm start` or `expo start`
2. Open in **Expo Go** (local notifications only) or **development build** (full features)
3. Login as a client user
4. Allow notification permissions when prompted
5. Check console for: "✅ Daily attendance reminder scheduled"
6. Mark attendance to receive instant confirmation

### Testing Scheduled Notifications
To test without waiting until 9:00 AM:

1. Open `src/services/notificationService.js`
2. Modify the trigger in `scheduleAttendanceReminder()`:
```javascript
const trigger = {
  hour: 15,    // Current hour + 1
  minute: 30,  // Current minute + 2
  repeats: true
};
```
3. Reload the app
4. Wait for the specified time

### Debug Commands
```javascript
// Get all scheduled notifications
const result = await notificationService.getScheduledNotifications();
console.log('Scheduled:', result.notifications);

// Check if attendance marked and send reminder
const reminder = await notificationService.checkAndSendAttendanceReminder(
  userId, 
  userName
);
console.log('Reminder sent:', reminder.reminderSent);
```

## Android Notification Channel
- **ID**: `attendance-reminders`
- **Name**: Attendance Reminders
- **Importance**: HIGH
- **Vibration**: [0, 250, 250, 250]
- **Light Color**: #4CAF50 (Green)

## Platform-Specific Behavior

### iOS
- Requires explicit permission request
- Notifications show in notification center
- Configurable badge count
- Sound and banner alerts

### Android
- Requires POST_NOTIFICATIONS permission (Android 13+)
- Uses notification channels
- Customizable vibration patterns
- LED light color support

## User Flow

1. **App Launch** → Request permissions → Save push token
2. **Daily 9:00 AM** → Local notification fires → User taps → Opens app
3. **Mark Attendance** → Instant confirmation notification
4. **Logout** → All scheduled notifications cancelled

## Firestore Data Structure

### User Document (with push token)
```javascript
{
  uid: "user123",
  fullName: "John Doe",
  email: "john@example.com",
  pushToken: "ExponentPushToken[xxxxxxxxxxxxxx]",
  pushTokenUpdatedAt: Timestamp,
  // ... other fields
}
```

## Best Practices

1. **Permission Timing**: Request permissions early but with context
2. **Token Management**: Update push token on app updates
3. **Notification Content**: Keep messages clear and actionable
4. **Cleanup**: Always cancel notifications on logout
5. **Testing**: Test on real devices for accurate behavior
6. **Scheduling**: Use consistent times for daily reminders
7. **Feedback**: Provide immediate confirmation for user actions

## Troubleshooting

### "Push notifications not supported in Expo Go" Warning
- **Cause**: Expo Go no longer supports remote push notifications (SDK 53+)
- **Solution**: Use a development build with `eas build` command
- **Workaround**: Local notifications still work in Expo Go for testing

### No Notifications Appearing
- Check permissions in device settings
- Verify notification channel is enabled (Android)
- Check app.json configuration
- Ensure app is not in background restrictions
- For Expo Go: Only local notifications work

### Scheduled Notifications Not Firing
- Check scheduled notifications list
- Verify trigger time is in the future
- Restart app after scheduling
- Check device battery optimization settings
- Ensure app has notification permissions

### Push Token Not Saving
- Verify Firestore rules allow user updates
- Check network connectivity
- Review console logs for errors
- Ensure user document exists

## Future Enhancements

1. **Server-side Push Notifications**: Use Expo Push Notification API
2. **Customizable Reminder Times**: Let users set their own reminder time
3. **Multiple Reminders**: Morning and afternoon reminders
4. **Rich Notifications**: Include quick actions (mark present/absent)
5. **Notification History**: Track sent notifications in Firestore
6. **Silent Hours**: Disable notifications on weekends/holidays

## Dependencies

```json
{
  "expo-notifications": "^0.28.x",
  "expo": "~51.x",
  "react-native": "0.74.x"
}
```

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Push Notifications Guide](https://reactnative.dev/docs/pushnotificationios)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
