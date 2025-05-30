import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SectionProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({
  title,
  description,
  actionText,
  onAction,
  children,
}: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {description && <Text style={styles.sectionDescription}>{description}</Text>}
        </View>
        
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  actionText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  sectionContent: {
    // Content styling is handled by children
  },
});