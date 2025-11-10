// User CRUD Modal Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import TextInput from './TextInput';
import Button from './Button';
import { updateUser, deleteUser } from '../services/userService';

const UserCRUDModal = ({ visible, user, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setEmployeeId(user.employeeId || '');
      setRole(user.role || 'client');
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!fullName.trim() || !employeeId.trim()) {
      Alert.alert('Error', 'Full name and Employee ID are required');
      return;
    }

    setLoading(true);
    const result = await updateUser(user.id, {
      fullName: fullName.trim(),
      employeeId: employeeId.trim(),
      role
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'User updated successfully');
      onSuccess();
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to update user');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user?.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await deleteUser(user.id);
            setLoading(false);

            if (result.success) {
              Alert.alert('Success', 'User deleted successfully');
              onSuccess();
              onClose();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
            />

            <Text style={styles.label}>Email (Read-only)</Text>
            <TextInput
              value={email}
              editable={false}
              style={styles.disabledInput}
            />

            <Text style={styles.label}>Employee ID</Text>
            <TextInput
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="Enter employee ID"
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
                onPress={() => setRole('client')}
              >
                <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>
                  Client
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Update User"
              onPress={handleUpdate}
              loading={loading}
              style={styles.updateButton}
            />
            <Button
              title="Delete User"
              onPress={handleDelete}
              loading={loading}
              variant="danger"
              style={styles.deleteButtonModal}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: theme.spacing.lg
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text
  },
  modalBody: {
    padding: theme.spacing.lg
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
  roleSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  roleButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center'
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  roleButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text
  },
  roleButtonTextActive: {
    color: theme.colors.white
  },
  modalFooter: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  updateButton: {
    marginBottom: theme.spacing.sm
  },
  deleteButtonModal: {
    backgroundColor: theme.colors.danger
  }
});

export default UserCRUDModal;
