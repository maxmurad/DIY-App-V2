import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Project {
  id: string;
  title: string;
  description: string;
  skill_level: number;
  skill_level_name: string;
  estimated_time: string;
  image_base64: string;
  hardware_identified: string;
  issue_type: string;
  safety_warnings: string[];
  materials: any[];
  tools: any[];
  steps: any[];
}

export default function DiagnosisScreen() {
  const { projectId } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/projects/${projectId}`
      );
      setProject(response.data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#10b981';
      case 2: return '#3b82f6';
      case 3: return '#f59e0b';
      case 4: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSkillLevelIcon = (level: number) => {
    switch (level) {
      case 1: return 'grade';
      case 2: return 'star-half';
      case 3: return 'star';
      case 4: return 'warning';
      default: return 'help';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Analyzing your repair...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load diagnosis</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Preview */}
        <Image 
          source={{ uri: `data:image/jpeg;base64,${project.image_base64}` }} 
          style={styles.headerImage}
        />

        {/* Title & Basic Info */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{project.title}</Text>
          
          <View style={styles.infoRow}>
            <View style={[styles.badge, { backgroundColor: getSkillLevelColor(project.skill_level) }]}>
              <MaterialIcons 
                name={getSkillLevelIcon(project.skill_level) as any} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.badgeText}>{project.skill_level_name}</Text>
            </View>
            
            <View style={styles.badge}>
              <MaterialIcons name="schedule" size={16} color="#6b7280" />
              <Text style={[styles.badgeText, { color: '#6b7280' }]}>
                {project.estimated_time}
              </Text>
            </View>
          </View>
        </View>

        {/* Identification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="search" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Identification</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Hardware Detected</Text>
            <Text style={styles.infoValue}>{project.hardware_identified}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Issue Type</Text>
            <Text style={styles.infoValue}>{project.issue_type}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Problem Description</Text>
          </View>
          <Text style={styles.description}>{project.description}</Text>
        </View>

        {/* Safety Warnings */}
        {project.safety_warnings && project.safety_warnings.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.warningHeader]}>
              <MaterialIcons name="warning" size={24} color="#f59e0b" />
              <Text style={[styles.sectionTitle, { color: '#f59e0b' }]}>Safety Warnings</Text>
            </View>
            {project.safety_warnings.map((warning, index) => (
              <View key={index} style={styles.warningCard}>
                <MaterialIcons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{project.steps.length}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{project.materials.length}</Text>
            <Text style={styles.statLabel}>Materials</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{project.tools.length}</Text>
            <Text style={styles.statLabel}>Tools</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => router.push({
            pathname: '/project',
            params: { projectId: project.id }
          })}
        >
          <Text style={styles.continueButtonText}>View Repair Instructions</Text>
          <MaterialIcons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#ef4444',
  },
  headerImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#e5e7eb',
  },
  headerSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  warningHeader: {
    backgroundColor: '#fef3c7',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 16,
    padding: 12,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  continueButton: {
    backgroundColor: '#10b981',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});