import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const HOUZZ_GREEN = '#3dae2b';

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HOUZZ_GREEN} />
          <Text style={styles.loadingText}>Analyzing your repair...</Text>
        </View>
      </View>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        <View style={styles.imageContainer}>
            <Image 
            source={{ uri: `data:image/jpeg;base64,${project.image_base64}` }} 
            style={styles.headerImage}
            />
            <View style={styles.overlay} />
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </SafeAreaView>
            <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{project.title}</Text>
                <Text style={styles.headerSubtitle}>{project.issue_type} • {project.estimated_time}</Text>
            </View>
        </View>

        {/* Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identification</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Hardware</Text>
                <Text style={styles.infoValue}>{project.hardware_identified}</Text>
            </View>
            <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Difficulty</Text>
                <Text style={[styles.infoValue, { color: HOUZZ_GREEN }]}>{project.skill_level_name}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem</Text>
          <Text style={styles.description}>{project.description}</Text>
        </View>

        {/* Safety Warnings */}
        {project.safety_warnings && project.safety_warnings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.warningHeader}>
              <MaterialIcons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.warningTitle}>Safety First</Text>
            </View>
            {project.safety_warnings.map((warning, index) => (
              <View key={index} style={styles.warningRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <View style={styles.footer}>
            <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push({
                pathname: '/project',
                params: { projectId: project.id }
            })}
            >
            <Text style={styles.continueButtonText}>Start Repair</Text>
            <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  imageContainer: {
      height: 400,
      width: '100%',
      position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerSafeArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
  },
  closeButton: {
      marginLeft: 20,
      padding: 8,
  },
  headerTextContainer: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
  },
  headerTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 8,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
  },
  headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '500',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  infoBlock: {
      flex: 1,
  },
  infoLabel: {
      fontSize: 12,
      color: '#888',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
  },
  infoValue: {
      fontSize: 18,
      color: '#333',
      fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
  },
  warningTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#f59e0b',
  },
  warningRow: {
      flexDirection: 'row',
      marginBottom: 8,
  },
  bulletPoint: {
      fontSize: 16,
      color: '#666',
      marginRight: 8,
      lineHeight: 24,
  },
  warningText: {
      flex: 1,
      fontSize: 15,
      color: '#666',
      lineHeight: 24,
  },
  footer: {
      padding: 24,
  },
  continueButton: {
    backgroundColor: HOUZZ_GREEN,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: HOUZZ_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
