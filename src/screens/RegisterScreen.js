// Register Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { theme } from '../config/theme';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import { registerUser } from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    homeAddress: '',
    contact: '',
    gender: 'male',
    assignedArea: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await registerUser(
      formData.email,
      formData.password,
      formData.fullName,
      'client', // Default role is client
      formData.employeeId,
      {
        homeAddress: formData.homeAddress,
        contact: formData.contact,
        gender: formData.gender,
        assignedArea: formData.assignedArea
      }
    );
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Success',
        'Account created successfully! You can now login.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register for Smart Attendance</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            placeholder="Enter your full name"
            error={errors.fullName}
          />

          <TextInput
            label="Employee ID"
            value={formData.employeeId}
            onChangeText={(value) => handleChange('employeeId', value)}
            placeholder="Enter your employee ID"
            error={errors.employeeId}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
          />

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Register"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Login
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.md
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight
  },
  form: {
    width: '100%'
  },
  registerButton: {
    marginTop: theme.spacing.md
  },
  loginContainer: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight
  },
  loginLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontWeight: theme.fontWeight.bold
  }
});

export default RegisterScreen;
