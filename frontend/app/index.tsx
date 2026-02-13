import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, Dimensions, StatusBar, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Houzz-like Green
const HOUZZ_GREEN = '#3dae2b'; 

export default function HomeScreen() {
  const router = useRouter();
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentProjects();
  }, []);

  const fetchRecentProjects = async () => {
    try {
      // Fetch only first 5 for the carousel
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/projects`);
      if (response.data && response.data.projects) {
        setRecentProjects(response.data.projects.slice(0, 5));
      }
    } catch (error) {
      console.log("Could not fetch recent projects for home screen", error);
    }
  };

  const renderProjectCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => router.push({ pathname: '/project', params: { projectId: item.id } })}
    >
      <Image 
        source={{ uri: item.thumbnail_base64 || (item.image_base64.startsWith('data:') ? item.image_base64 : `data:image/jpeg;base64,${item.image_base64}`) }} 
        style={styles.projectCardImage} 
      />
      <View style={styles.projectCardOverlay}>
        <Text style={styles.projectCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.projectCardSubtitle} numberOfLines={1}>{item.issue_type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }} // High quality interior
          style={styles.heroImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={styles.heroGradient}
          >
            <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>The New Way to Repair Your Home</Text>
                <Text style={styles.heroSubtitle}>AI-powered diagnosis for every DIY project.</Text>
                
                <TouchableOpacity 
                  style={styles.searchBarButton}
                  onPress={() => router.push('/camera')}
                  activeOpacity={0.9}
                >
                  <MaterialIcons name="search" size={24} color="#666" />
                  <Text style={styles.searchBarText}>What needs fixing?</Text>
                  <View style={styles.cameraIconCircle}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        {/* BROWSE BY CATEGORY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoryGrid}>
            {[
              { name: 'Plumbing', icon: 'faucet', library: 'FontAwesome5' },
              { name: 'Electrical', icon: 'bolt', library: 'MaterialIcons' },
              { name: 'Walls', icon: 'format-paint', library: 'MaterialIcons' },
              { name: 'Appliances', icon: 'blender', library: 'MaterialIcons' },
              { name: 'Flooring', icon: 'layers', library: 'MaterialIcons' },
              { name: 'Exterior', icon: 'house-siding', library: 'MaterialIcons' },
            ].map((cat, index) => (
              <TouchableOpacity key={index} style={styles.categoryItem} onPress={() => router.push('/camera')}>
                <View style={styles.categoryIconContainer}>
                  {cat.library === 'FontAwesome5' ? (
                    <FontAwesome5 name={cat.icon} size={24} color="#444" />
                  ) : (
                    <MaterialIcons name={cat.icon as any} size={28} color="#444" />
                  )}
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* RECENT PROJECTS CAROUSEL (Moved above How It Works) */}
        {recentProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your Projects</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentProjects}
              renderItem={renderProjectCard}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            />
          </View>
        )}

        {/* HOW IT WORKS (Styled like Houzz "Editorial") */}
        <View style={styles.editorialSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <TouchableOpacity onPress={() => router.push('/camera')} activeOpacity={0.9}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Capture the Issue</Text>
                <Text style={styles.stepDesc}>Take a photo/video of what needs fixing.</Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>AI Diagnosis</Text>
                <Text style={styles.stepDesc}>Get instant identification & solution.</Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Repair with Confidence</Text>
                <Text style={styles.stepDesc}>Follow step-by-step interactive guides.</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <MaterialIcons name="home-repair-service" size={32} color="#ccc" />
          <Text style={styles.footerText}>DIY App v2.0</Text>
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
  heroImage: {
    width: '100%',
    height: 450,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  heroSafeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800', // Serif-like heavy weight
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Attempt serif font
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#eee',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  searchBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBarText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  cameraIconCircle: {
    backgroundColor: HOUZZ_GREEN,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '31%', // 3 columns
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: HOUZZ_GREEN,
    fontSize: 14,
    fontWeight: '600',
  },
  carouselContent: {
    paddingRight: 20,
  },
  projectCard: {
    width: 200,
    height: 150,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  projectCardImage: {
    width: '100%',
    height: '100%',
  },
  projectCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
  },
  projectCardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  projectCardSubtitle: {
    color: '#ddd',
    fontSize: 12,
  },
  editorialSection: {
    padding: 24,
    backgroundColor: '#f9f9f9',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumberContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 48,
    fontWeight: '200',
    color: '#ddd',
    lineHeight: 48,
  },
  stepTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    padding: 40,
  },
  footerText: {
    marginTop: 12,
    color: '#999',
    fontSize: 14,
  },
});
