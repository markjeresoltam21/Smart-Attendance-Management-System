// Profile Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import Card from '../components/Card';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../services/userService';

const ProfileScreen = ({ navigation }) => {
  const { userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gender, setGender] = useState('male');
  const [assignedArea, setAssignedArea] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || '');
      setEmail(userData.email || '');
      setEmployeeId(userData.employeeId || '');
      setHomeAddress(userData.homeAddress || '');
      setContactNumber(userData.contactNumber || '');
      setGender(userData.gender || 'male');
      setAssignedArea(userData.assignedArea || '');
      setProfileImage(userData.profileImage || null);
    }
  }, [userData]);

  const pickImage = async () => {
    try {
      console.log('📸 Pick image function called');
      
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload a profile picture.');
        return;
      }

      // Launch image picker
      console.log('📸 Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true
      });

      console.log('📸 Image picker result:', result.canceled ? 'Cancelled' : 'Selected');

      if (!result.canceled) {
        // Convert to base64 data URI
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        console.log('📸 Image URI created, length:', imageUri.length);
        setProfileImage(imageUri);
        Alert.alert('Success', 'Profile picture selected! Click "Save Changes" to update.');
      }
    } catch (error) {
      console.error('📸 Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (!employeeId.trim()) {
      Alert.alert('Error', 'Employee ID is required');
      return;
    }

    setLoading(true);

    const updateData = {
      fullName: fullName.trim(),
      employeeId: employeeId.trim(),
      homeAddress: homeAddress.trim(),
      contactNumber: contactNumber.trim(),
      gender: gender,
      assignedArea: assignedArea.trim(),
      profileImage: profileImage
    };

    const result = await updateUser(userData.id, updateData);

    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: async () => {
            await refreshUserData();
            navigation.goBack();
          }
        }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  if (!userData) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Card>
          {/* Profile Picture Section */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={pickImage}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color={theme.colors.textLight} />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.uploadText}>Tap to change profile picture</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              editable={false}
              placeholder="Email"
              style={styles.disabledInput}
            />
            <Text style={styles.helpText}>Email cannot be changed</Text>

            <Text style={styles.label}>Employee ID</Text>
            <TextInput
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="Enter employee ID"
            />

            <Text style={styles.label}>Home Address</Text>
            <TextInput
              value={homeAddress}
              onChangeText={setHomeAddress}
              placeholder="Enter home address"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Enter contact number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity 
                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]} 
                onPress={() => setGender('male')}
              >
                <Ionicons name="male" size={20} color={gender === 'male' ? '#fff' : '#666'} />
                <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]} 
                onPress={() => setGender('female')}
              >
                <Ionicons name="female" size={20} color={gender === 'female' ? '#fff' : '#666'} />
                <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Assigned Area</Text>
            <TextInput
              value={assignedArea}
              onChangeText={setAssignedArea}
              placeholder="Enter assigned area"
            />

            <Text style={styles.label}>Role</Text>
            <TextInput
              value={userData.role.toUpperCase()}
              editable={false}
              style={styles.disabledInput}
            />
            <Text style={styles.helpText}>Role cannot be changed</Text>
          </View>

          {/* Save Button */}
          <Button
            title={loading ? "Saving..." : "Save Changes"}
            onPress={handleUpdateProfile}
            disabled={loading}
            style={styles.saveButton}
          />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    padding: theme.spacing.xs
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white
  },
  placeholder: {
    width: 40
  },
  content: {
    flex: 1,
    padding: theme.spacing.md
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white
  },
  uploadText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs
  },
  form: {
    marginBottom: theme.spacing.lg
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md
  },
  disabledInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textLight
  },
  helpText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic'
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  genderButtonActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  genderButtonTextActive: {
    color: '#fff'
  },
  saveButton: {
    marginTop: theme.spacing.md
  }
});

export default ProfileScreen;
