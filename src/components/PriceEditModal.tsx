import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { MenuItem } from '../types';

interface PriceEditModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (itemId: string, newPrice: number) => Promise<void>;
}

export const PriceEditModal: React.FC<PriceEditModalProps> = ({
  visible,
  item,
  onClose,
  onSave,
}) => {
  const [priceStr, setPriceStr] = useState<string>(item ? item.price.toString() : '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when item changes
  React.useEffect(() => {
    if (item) {
      setPriceStr(item.price.toFixed(2));
      setErrorMsg(null);
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    const num = parseFloat(priceStr);
    if (isNaN(num) || num < 0) {
      setErrorMsg('Please enter a valid positive price.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      await onSave(item.id, num);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update price.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <Text style={styles.title}>Update Item Price</Text>
          <Text style={styles.subtitle}>{item.name}</Text>

          {/* Price Input Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.input}
              value={priceStr}
              onChangeText={setPriceStr}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              selectTextOnFocus
            />
          </View>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {/* Quick Increment Shortcuts */}
          <View style={styles.quickChipsRow}>
            {[+0.5, +1.0, +2.0, -0.5].map((delta) => (
              <TouchableOpacity
                key={delta}
                style={styles.quickChip}
                onPress={() => {
                  const current = parseFloat(priceStr) || item.price;
                  const next = Math.max(0, current + delta);
                  setPriceStr(next.toFixed(2));
                }}
              >
                <Text style={styles.quickChipText}>
                  {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Syncing...' : 'Save & Sync'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    height: 56,
    marginBottom: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickChip: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
