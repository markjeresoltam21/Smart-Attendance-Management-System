// App Navigator - Handles routing based on authentication state
import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminDashboard from '../screens/AdminDashboard';
import ClientDashboard from '../screens/ClientDashboard';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, userData, loading } = useAuth();

  // Memoize the auth state to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!user, [user]);
  const userRole = useMemo(() => userData?.role, [userData?.role]);

  // Show loading spinner while checking auth state or loading user data
  if (loading) {
    return <LoadingSpinner message="Loading app..." />;
  }

  // If user is logged in but userData is not loaded yet, show loading
  if (user && !userData) {
    return <LoadingSpinner message="Loading user data..." />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // Auth Stack - Not logged in
        <Stack.Navigator
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : (
        // App Stack - Logged in (Role-based routing)
        <Stack.Navigator
          screenOptions={{
            headerShown: false
          }}
        >
          {userRole === 'admin' ? (
            <>
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          ) : userRole === 'client' ? (
            <>
              <Stack.Screen name="ClientDashboard" component={ClientDashboard} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          ) : (
            // Fallback if role is not set properly
            <>
              <Stack.Screen name="ClientDashboard" component={ClientDashboard} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
