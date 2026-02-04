import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="home-repair-service" size={48} color="#10b981" />
          <Text style={styles.title}>DIY Home Repair</Text>
          <Text style={styles.subtitle}>Your AI-Powered Repair Assistant</Text>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={() => router.push('/camera')}
          activeOpacity={0.8}
        >
          <View style={styles.mainButtonContent}>
            <MaterialIcons name="photo-camera" size={32} color="#fff" />
            <Text style={styles.mainButtonText}>Start New Repair</Text>
            <Text style={styles.mainButtonSubtext}>Take a photo or upload image</Text>
          </View>
        </TouchableOpacity>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="photo-camera" size={28} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>1. Capture the Issue</Text>
              <Text style={styles.featureText}>Take a photo of what needs fixing</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="auto-fix-high" size={28} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>2. AI Diagnosis</Text>
              <Text style={styles.featureText}>Get instant analysis and identification</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="build" size={28} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>3. Step-by-Step Guide</Text>
              <Text style={styles.featureText}>Follow detailed repair instructions</Text>
            </View>
          </View>

          {Platform.OS === 'ios' && (
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialIcons name="view-in-ar" size={28} color="#10b981" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>4. AR Guidance (iOS)</Text>
                <Text style={styles.featureText}>See overlay guidance in real-time</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/history')}
          >
            <MaterialIcons name="history" size={24} color="#10b981" />
            <Text style={styles.secondaryButtonText}>My Projects</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color="#3b82f6" />
          <Text style={styles.infoBannerText}>
            Supports skill levels from Novice to Expert with safety warnings
          </Text>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  mainButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonContent: {
    alignItems: 'center',
  },
  mainButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  mainButtonSubtext: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickAccessContainer: {
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  infoBanner: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
  },
});