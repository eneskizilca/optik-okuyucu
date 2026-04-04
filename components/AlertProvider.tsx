import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });
  const scaleAnim = useState(new Animated.Value(0))[0];

  const showAlert = (options: AlertOptions) => {
    setAlertOptions({
      type: 'info',
      buttons: [{ text: 'Tamam', style: 'default' }],
      ...options,
    });
    setVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const hideAlert = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const handleButtonPress = async (button: AlertButton) => {
    // Eğer async bir işlem varsa (onPress varsa), önce onu çalıştır
    if (button.onPress) {
      try {
        await Promise.resolve(button.onPress());
      } catch (error) {
        console.error('Button press error:', error);
      }
    }
    // Sonra modal'ı kapat
    hideAlert();
  };

  const getIconConfig = () => {
    switch (alertOptions.type) {
      case 'success':
        return { name: 'check-circle', color: Colors.success };
      case 'error':
        return { name: 'alert-circle', color: Colors.error };
      case 'warning':
        return { name: 'alert', color: Colors.warning };
      case 'confirm':
        return { name: 'help-circle', color: Colors.primary };
      default:
        return { name: 'information', color: Colors.primary };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={hideAlert}
          />
          <Animated.View 
            style={[
              styles.alertBox,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={iconConfig.name as any} 
                  size={40} 
                  color={iconConfig.color} 
                />
              </View>
            </View>

            <Text style={styles.title}>{alertOptions.title}</Text>
            {alertOptions.message && (
              <Text style={styles.message}>{alertOptions.message}</Text>
            )}

            <View style={styles.buttonContainer}>
              {alertOptions.buttons?.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isDestructive && styles.buttonDestructive,
                      isCancel && styles.buttonCancel,
                      alertOptions.buttons!.length === 1 && styles.buttonSingle,
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive && styles.buttonTextDestructive,
                        isCancel && styles.buttonTextCancel,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  alertBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSingle: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDestructive: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: Colors.text,
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
