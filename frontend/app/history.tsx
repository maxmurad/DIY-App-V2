import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  thumbnail_base64?: string;
  hardware_identified: string;
  issue_type: string;
  created_at: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/projects`);
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const deleteProject = async (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${EXPO_PUBLIC_BACKEND_URL}/api/projects/${projectId}`);
              setProjects(projects.filter(p => p.id !== projectId));
              Alert.alert('Success', 'Project deleted');
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
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

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => router.push({
        pathname: '/project',
        params: { projectId: item.id }
      })}
    >
      {item.thumbnail_base64 || item.image_base64 ? (
        <Image
          source={{ uri: item.thumbnail_base64 || (item.image_base64 ? `data:image/jpeg;base64,${item.image_base64}` : undefined) }}
          style={styles.projectImage}
        />
      ) : (
        <View style={[styles.projectImage, { justifyContent: 'center', alignItems: 'center' }]}>
           <MaterialIcons name="image-not-supported" size={32} color="#9ca3af" />
        </View>
      )}
      <View style={styles.projectContent}>
        <Text style={styles.projectTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.projectMeta}>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(item.skill_level) }]}>
            <Text style={styles.skillBadgeText}>{item.skill_level_name}</Text>
          </View>
          <View style={styles.timeBadge}>
            <MaterialIcons name="schedule" size={14} color="#6b7280" />
            <Text style={styles.timeText}>{item.estimated_time}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteProject(item.id)}
      >
        <MaterialIcons name="delete-outline" size={24} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Projects Yet</Text>
      <Text style={styles.emptyText}>
        Start by capturing a photo of something that needs repair
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/camera')}
      >
        <MaterialIcons name="add-a-photo" size={24} color="#fff" />
        <Text style={styles.startButtonText}>Take First Photo</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Projects</Text>
        <Text style={styles.headerSubtitle}>{projects.length} saved repair{projects.length !== 1 ? 's' : ''}</Text>
      </View>
      
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          projects.length === 0 && styles.listContentEmpty
        ]}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectImage: {
    width: 100,
    height: 120,
    backgroundColor: '#e5e7eb',
  },
  projectContent: {
    flex: 1,
    padding: 12,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
