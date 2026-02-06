import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useProfile, useUpdateProfile, useUploadAvatar } from '../../hooks/useProfile';
import { Avatar, Button } from '../../components';
import { colors, spacing, typography } from '../../theme';

export function ProfileEditScreen() {
  const navigation = useNavigation();
  const { data: profile } = useProfile();
  const updateMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handlePickImage = useCallback(async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'}.`
      );
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      setAvatarPreview(result.assets[0].uri);
    }
  }, []);

  const handleChangeAvatar = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickImage('camera');
          } else if (buttonIndex === 2) {
            handlePickImage('library');
          }
        }
      );
    } else {
      Alert.alert('Change Avatar', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handlePickImage('camera') },
        { text: 'Choose from Library', onPress: () => handlePickImage('library') },
      ]);
    }
  }, [handlePickImage]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      // Upload avatar if changed
      let avatarUrl = profile?.avatarUrl;
      if (avatarPreview) {
        const result = await uploadAvatarMutation.mutateAsync(avatarPreview);
        avatarUrl = result.avatarUrl;
      }

      // Update profile
      await updateMutation.mutateAsync({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatarUrl,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  }, [name, bio, avatarPreview, profile, uploadAvatarMutation, updateMutation, navigation]);

  const isLoading = updateMutation.isPending || uploadAvatarMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangeAvatar} disabled={isLoading}>
            <Avatar
              source={avatarPreview || profile?.avatarUrl}
              name={name || profile?.name}
              size="xl"
            />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{profile?.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isLoading}
            fullWidth
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            disabled={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.screenHorizontal,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.inputPadding,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  readOnlyInput: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.inputPadding,
  },
  readOnlyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  helperText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
