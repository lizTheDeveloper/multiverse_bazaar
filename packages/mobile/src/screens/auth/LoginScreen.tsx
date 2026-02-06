import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';

type AuthMode = 'password' | 'magic-link' | 'magic-link-sent';

export function LoginScreen() {
  const { login, requestMagicLink, continueAsGuest } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handlePasswordLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLinkRequest() {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await requestMagicLink(email);
      setAuthMode('magic-link-sent');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuestMode() {
    await continueAsGuest();
  }

  function switchToMagicLink() {
    setAuthMode('magic-link');
    setPassword('');
  }

  function switchToPassword() {
    setAuthMode('password');
  }

  if (authMode === 'magic-link-sent') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>✉️</Text>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a magic link to {email}. Click the link in your email to sign in.
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setAuthMode('magic-link')}
            >
              <Text style={styles.buttonText}>Send Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={switchToPassword}
            >
              <Text style={styles.guestButtonText}>Use Password Instead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🌌</Text>
            <Text style={styles.title}>Multiverse Bazaar</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            {authMode === 'password' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  textContentType="password"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={authMode === 'password' ? handlePasswordLogin : handleMagicLinkRequest}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading
                  ? 'Please wait...'
                  : authMode === 'password'
                    ? 'Sign In'
                    : 'Send Magic Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={authMode === 'password' ? switchToMagicLink : switchToPassword}
            >
              <Text style={styles.switchModeText}>
                {authMode === 'password'
                  ? 'Sign in with magic link instead'
                  : 'Sign in with password instead'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestMode}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.screenHorizontal,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.buttonPaddingVertical,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  switchModeText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  guestButton: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.buttonPaddingVertical,
    alignItems: 'center',
  },
  guestButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
});
