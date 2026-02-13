import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const HOUZZ_GREEN = '#3dae2b';

interface MaterialTool {
  id: string;
  name: string;
  category: string;
  estimated_cost?: string;
  already_owned: boolean;
}

interface InstructionStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  warning?: string;
  image_hint?: string;
}

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
  materials: MaterialTool[];
  tools: MaterialTool[];
  steps: InstructionStep[];
}

export default function ProjectScreen() {
  const { projectId } = useLocalSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

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

  const toggleItemOwnership = async (itemId: string, currentStatus: boolean) => {
    try {
      await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/projects/${projectId}/toggle-item`,
        {
          item_id: itemId,
          owned: !currentStatus
        }
      );
      
      // Update local state
      if (project) {
        const updatedProject = { ...project };
        updatedProject.materials = updatedProject.materials.map(m =>
          m.id === itemId ? { ...m, already_owned: !currentStatus } : m
        );
        updatedProject.tools = updatedProject.tools.map(t =>
          t.id === itemId ? { ...t, already_owned: !currentStatus } : t
        );
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      Alert.alert('Error', 'Failed to update item status');
    }
  };

  const openARView = () => {
    // AR Guide works on both platforms since it's a guided overlay, not true AR
    router.push({
      pathname: '/ar-guide',
      params: { 
        steps: JSON.stringify(project?.steps || []),
        title: project?.title || 'Repair Guide'
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HOUZZ_GREEN} />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load project</Text>
        </View>
      </SafeAreaView>
    );
  }

  const neededMaterials = project.materials.filter(m => !m.already_owned);
  const neededTools = project.tools.filter(t => !t.already_owned);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Project Image Header */}
        <View style={styles.imageHeaderContainer}>
            <Image
            source={{ uri: project.image_base64.startsWith('data:') ? project.image_base64 : `data:image/jpeg;base64,${project.image_base64}` }}
            style={styles.projectImageHeader}
            resizeMode="cover"
            />
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          
          <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={styles.metaText}>{project.estimated_time}</Text>
              </View>
              <View style={styles.metaItem}>
                  <MaterialIcons name="equalizer" size={16} color="#666" />
                  <Text style={styles.metaText}>{project.skill_level_name}</Text>
              </View>
          </View>

          {/* AR Guide Button - Available on all platforms */}
          <TouchableOpacity style={styles.arButton} onPress={openARView}>
            <MaterialIcons name="view-in-ar" size={20} color={HOUZZ_GREEN} />
            <Text style={styles.arButtonText}>AR Guide</Text>
            <View style={styles.experimentalTag}>
              <Text style={styles.experimentalTagText}>BETA</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Materials & Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials</Text>
          {project.materials.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggleItemOwnership(item.id, item.already_owned)}
            >
              <MaterialIcons
                name={item.already_owned ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={item.already_owned ? '#aaa' : HOUZZ_GREEN}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, item.already_owned && styles.itemNameOwned]}>
                  {item.name}
                </Text>
                {item.estimated_cost && (
                  <Text style={styles.itemCost}>{item.estimated_cost}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools</Text>
          {project.tools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggleItemOwnership(item.id, item.already_owned)}
            >
              <MaterialIcons
                name={item.already_owned ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={item.already_owned ? '#aaa' : HOUZZ_GREEN}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, item.already_owned && styles.itemNameOwned]}>
                  {item.name}
                </Text>
                {item.estimated_cost && (
                  <Text style={styles.itemCost}>{item.estimated_cost}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step-by-Step Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>

          {project.steps.map((step) => (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepLeftColumn}>
                  <View style={[styles.stepCircle, expandedStep === step.step_number && styles.stepCircleActive]}>
                      <Text style={[styles.stepNumber, expandedStep === step.step_number && styles.stepNumberActive]}>{step.step_number}</Text>
                  </View>
                  {step.step_number !== project.steps.length && <View style={styles.stepLine} />}
              </View>
              
              <View style={styles.stepRightColumn}>
                  <TouchableOpacity
                    style={styles.stepHeader}
                    onPress={() => setExpandedStep(expandedStep === step.step_number ? null : step.step_number)}
                  >
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </TouchableOpacity>

                  {expandedStep === step.step_number && (
                    <View style={styles.stepBody}>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                      
                      {step.image_hint && (
                        <View style={styles.hintBox}>
                          <MaterialIcons name="lightbulb" size={18} color="#f59e0b" />
                          <Text style={styles.hintText}>{step.image_hint}</Text>
                        </View>
                      )}
                      
                      {step.warning && (
                        <View style={styles.warningBox}>
                          <MaterialIcons name="warning" size={18} color="#ef4444" />
                          <Text style={styles.warningText}>{step.warning}</Text>
                        </View>
                      )}
                    </View>
                  )}
              </View>
            </View>
          ))}
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
  imageHeaderContainer: {
      height: 300,
      width: '100%',
      position: 'relative',
  },
  projectImageHeader: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  projectTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  metaRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
  },
  metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  metaText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
  },
  arButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  arButtonText: {
    color: HOUZZ_GREEN,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  itemNameOwned: {
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  itemCost: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  stepContainer: {
      flexDirection: 'row',
  },
  stepLeftColumn: {
      alignItems: 'center',
      width: 40,
      marginRight: 12,
  },
  stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#f0f0f0',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
  },
  stepCircleActive: {
      backgroundColor: HOUZZ_GREEN,
  },
  stepNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: '#666',
  },
  stepNumberActive: {
      color: '#fff',
  },
  stepLine: {
      width: 2,
      flex: 1,
      backgroundColor: '#f0f0f0',
      marginBottom: 4,
  },
  stepRightColumn: {
      flex: 1,
      paddingBottom: 24,
  },
  stepHeader: {
      minHeight: 32,
      justifyContent: 'center',
  },
  stepTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
  },
  stepBody: {
      marginTop: 8,
  },
  stepDescription: {
      fontSize: 15,
      color: '#555',
      lineHeight: 24,
      marginBottom: 12,
  },
  hintBox: {
      flexDirection: 'row',
      backgroundColor: '#fffbeb',
      padding: 12,
      borderRadius: 8,
      gap: 8,
      marginBottom: 8,
  },
  hintText: {
      flex: 1,
      fontSize: 13,
      color: '#92400e',
      lineHeight: 18,
  },
  warningBox: {
      flexDirection: 'row',
      backgroundColor: '#fef2f2',
      padding: 12,
      borderRadius: 8,
      gap: 8,
  },
  warningText: {
      flex: 1,
      fontSize: 13,
      color: '#991b1b',
      lineHeight: 18,
  },
});
