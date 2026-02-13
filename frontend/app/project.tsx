import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
    if (Platform.OS !== 'ios') {
      Alert.alert('AR Not Available', 'AR features are currently only available on iOS devices.');
      return;
    }
    Alert.alert('AR Feature', 'AR overlay guidance will be available in the next update. This feature will show 3D projections to guide your repair.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.arButton} onPress={openARView}>
              <MaterialIcons name="view-in-ar" size={24} color="#fff" />
              <Text style={styles.arButtonText}>AR Guide</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Materials & Tools */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="shopping-cart" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Materials</Text>
          </View>
          {project.materials.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => toggleItemOwnership(item.id, item.already_owned)}
            >
              <MaterialIcons
                name={item.already_owned ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={item.already_owned ? '#10b981' : '#d1d5db'}
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
          
          {neededMaterials.length > 0 && (
            <View style={styles.mockPurchaseButton}>
              <MaterialIcons name="add-shopping-cart" size={20} color="#3b82f6" />
              <Text style={styles.mockPurchaseText}>
                Add {neededMaterials.length} missing item(s) to cart (Mock)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="build" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Tools</Text>
          </View>
          {project.tools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => toggleItemOwnership(item.id, item.already_owned)}
            >
              <MaterialIcons
                name={item.already_owned ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={item.already_owned ? '#10b981' : '#d1d5db'}
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
          
          {neededTools.length > 0 && (
            <View style={styles.mockPurchaseButton}>
              <MaterialIcons name="add-shopping-cart" size={20} color="#3b82f6" />
              <Text style={styles.mockPurchaseText}>
                Add {neededTools.length} missing tool(s) to cart (Mock)
              </Text>
            </View>
          )}
        </View>

        {/* Step-by-Step Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="list" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
          </View>

          {project.steps.map((step) => (
            <View key={step.id} style={styles.stepCard}>
              <TouchableOpacity
                style={styles.stepHeader}
                onPress={() => setExpandedStep(expandedStep === step.step_number ? null : step.step_number)}
              >
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.step_number}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <MaterialIcons
                  name={expandedStep === step.step_number ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>

              {expandedStep === step.step_number && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  
                  {step.image_hint && (
                    <View style={styles.hintCard}>
                      <MaterialIcons name="lightbulb-outline" size={20} color="#f59e0b" />
                      <Text style={styles.hintText}>{step.image_hint}</Text>
                    </View>
                  )}
                  
                  {step.warning && (
                    <View style={styles.stepWarningCard}>
                      <MaterialIcons name="warning" size={20} color="#ef4444" />
                      <Text style={styles.stepWarningText}>{step.warning}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  arButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  arButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  itemNameOwned: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  itemCost: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  mockPurchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  mockPurchaseText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  stepCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  stepContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stepDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  hintCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  stepWarningCard: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  stepWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
    lineHeight: 18,
  },
});
