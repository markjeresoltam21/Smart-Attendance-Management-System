# 🚀 Quick Start Guide - SAMS

## Start the App (Choose One Method)

### Method 1: Standard Start
```powershell
npm start
```

### Method 2: Clear Cache Start
```powershell
npm start -- --clear
```

### Method 3: Expo Start
```powershell
npx expo start
```

---

## 📱 Run on Device/Emulator

### Android
- Press `a` in terminal
- Or scan QR code with Expo Go app

### iOS
- Press `i` in terminal  
- Or scan QR code with Expo Go app

### Web (for testing only)
- Press `w` in terminal

---

## 👤 Test Accounts

### Admin Account
- **Email**: admin@smartattendance.com
- **Password**: admin123
- **Access**: Full control, all features

### Client Account
- **Email**: client@smartattendance.com  
- **Password**: client123
- **Access**: Mark attendance, view own records

---

## 🔔 Testing Notifications

### 1. Login as Client
Allow permissions when prompted

### 2. Check Console
Look for: "✅ Daily attendance reminder scheduled"

### 3. Mark Attendance
Should receive instant confirmation notification

### 4. Test Daily Reminder
- **Option A**: Wait until 9:00 AM next day
- **Option B**: Change time in `notificationService.js`:
  ```javascript
  // Line ~50 in scheduleAttendanceReminder()
  const trigger = {
    hour: 15,    // Your current hour + 1
    minute: 30,  // Your current minute + 2
    repeats: true
  };
  ```

---

## 🎨 Key Features to Test

### Admin Dashboard
1. **Dashboard Tab**: View pie chart, filter by date, generate PDF
2. **Attendance Tab**: Click FAB (bottom right) to add attendance
3. **Users Tab**: Click FAB (bottom right) to add user

### Client Dashboard
1. **Statistics**: View today's attendance summary
2. **Mark Attendance**: Click button to mark present
3. **Bar Chart**: See 7-day attendance visualization
4. **Recent Activity**: Edit/delete your own records

### Profile Screen
1. **Upload Image**: Click camera icon
2. **Edit Fields**: Update name, address, contact, gender, area
3. **Save**: All changes sync to Firebase

---

## 📊 Sample Data

### Attendance Records
35 records already populated (via migration script)

### Users
7 users created (2 admins, 5 clients)

---

## 🛠️ Troubleshooting

### App Won't Start
```powershell
npm start -- --clear
```

### Module Not Found
```powershell
npm install
```

### Firebase Error
- Verify `google-services.json` exists
- Check Firebase console for enabled services

### Notifications Not Working
- Check permissions in device settings
- Verify app.json has notification config
- Check console for error messages

---

## 📂 Project Structure (Quick Reference)

```
src/
├── screens/
│   ├── AdminDashboard.js    ← Admin interface
│   ├── ClientDashboard.js   ← Client interface
│   ├── LoginScreen.js       ← Login page
│   ├── ProfileScreen.js     ← Edit profile
│   └── RegisterScreen.js    ← Register new user
├── services/
│   ├── authService.js           ← Login/logout
│   ├── userService.js           ← User CRUD
│   ├── attendanceService.js     ← Attendance CRUD
│   ├── notificationService.js   ← Push notifications
│   └── reportService.js         ← PDF generation
└── config/
    └── firebase.js              ← Firebase setup
```

---

## 🎯 Testing Checklist

- [ ] Login with admin account
- [ ] View pie chart on admin dashboard
- [ ] Generate PDF report
- [ ] Add user via FAB
- [ ] Add attendance via FAB
- [ ] Edit/delete user
- [ ] Edit/delete attendance
- [ ] Login with client account
- [ ] Allow notification permissions
- [ ] Mark attendance (receive confirmation)
- [ ] View bar chart
- [ ] Edit own attendance record
- [ ] Upload profile image
- [ ] Edit profile fields
- [ ] Logout (notifications cancelled)

---

## 📖 Documentation

- **README.md** - Complete documentation
- **NOTIFICATIONS.md** - Notification details
- **IMPLEMENTATION_SUMMARY.md** - Feature list

---

## 🎉 Ready to Go!

The app is fully configured and ready for testing. All features are implemented and working.

**Need Help?**
- Check console logs for errors
- Review documentation files
- Verify Firebase console settings

**Happy Testing! 🚀**
