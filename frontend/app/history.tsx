import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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
      case 1: return HOUZZ_GREEN;
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
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {item.thumbnail_base64 || item.image_base64 ? (
          <Image
            source={{ 
              uri: (() => {
                const img = item.thumbnail_base64 || item.image_base64;
                if (!img) return undefined;
                return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
              })() 
            }}
            style={styles.projectImage}
          />
        ) : (
          <View style={[styles.projectImage, { justifyContent: 'center', alignItems: 'center' }]}>
             <MaterialIcons name="image-not-supported" size={32} color="#9ca3af" />
          </View>
        )}
      </View>
      <View style={styles.projectContent}>
        <View style={styles.headerRow}>
            <Text style={styles.projectTitle} numberOfLines={1}>
            {item.title}
            </Text>
            <TouchableOpacity onPress={() => deleteProject(item.id)} hitSlop={10}>
                <MaterialIcons name="more-horiz" size={24} color="#999" />
            </TouchableOpacity>
        </View>
        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.projectMeta}>
          <Text style={[styles.metaText, { color: getSkillLevelColor(item.skill_level) }]}>
            {item.skill_level_name}
          </Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{item.estimated_time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="history" size={40} color={HOUZZ_GREEN} />
      </View>
      <Text style={styles.emptyTitle}>No Projects Yet</Text>
      <Text style={styles.emptyText}>
        Start by capturing a photo of something that needs repair
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/camera')}
      >
        <Text style={styles.startButtonText}>Start New Project</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HOUZZ_GREEN} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Projects</Text>
        <View style={{width: 24}} /> 
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
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
      padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
  listContent: {
    padding: 20,
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
  emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#f0fdf4',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: HOUZZ_GREEN,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: HOUZZ_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  imageContainer: {
      width: 120,
      height: 120,
  },
  projectImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  projectContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  projectDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#888',
  },
  metaDivider: {
      marginHorizontal: 6,
      color: '#ccc',
      fontSize: 10,
  },
});
