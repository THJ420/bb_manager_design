import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '../theme/colors';
import { loginStaff } from '../services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('manager.downtown@bbmanager.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [branchCode, setBranchCode] = useState('DT-01');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (!branchCode.trim()) {
      setErrorMessage('A designated Branch Code is required for local pickup management.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await loginStaff(email, password);
      // Navigate to main application dashboard
      router.replace('/(app)');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Ensure valid branch assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('manager.downtown@bbmanager.internal');
    setPassword('manager1234');
    setBranchCode('DT-01');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>BB</Text>
          </View>
          <Text style={styles.appName}>BB MANAGER</Text>
          <Text style={styles.appTagline}>
            Enterprise Multi-Branch Pickup & Stock Terminal
          </Text>
        </View>

        {/* Centered Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Staff Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Authenticate with assigned restaurant credentials
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Staff Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. staff@restaurant.internal"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          {/* Branch Code Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Branch Terminal ID / Code</Text>
            <TextInput
              style={styles.textInput}
              value={branchCode}
              onChangeText={setBranchCode}
              placeholder="e.g. DT-01, WB-04"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.signInButtonText}>ENTER DASHBOARD</Text>
            )}
          </TouchableOpacity>

          {/* Demo Fill Option */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleQuickDemo}
            activeOpacity={0.7}
          >
            <Text style={styles.demoButtonText}>Load Demo Manager Credentials</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <Text style={styles.footerInfo}>
          PocketBase AsyncAuthStore • Local SQLite Outbox Active
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -1,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  appTagline: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  signInButton: {
    minHeight: 48,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  demoButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  demoButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  footerInfo: {
    marginTop: Spacing.xl,
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
});
