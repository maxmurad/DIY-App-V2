import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Text,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUZZ_GREEN = '#3dae2b';
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface StepImageSlideshowProps {
  projectId: string;
  stepId: string;
  stepTitle: string;
  onImageLoad?: () => void;
}

export default function StepImageSlideshow({ 
  projectId, 
  stepId, 
  stepTitle,
  onImageLoad 
}: StepImageSlideshowProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Check for existing images on mount
  useEffect(() => {
    checkExistingImages();
  }, [projectId, stepId]);

  const checkExistingImages = async () => {
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/projects/${projectId}/steps/${stepId}/images`
      );
      
      if (response.data.success && response.data.images.length > 0) {
        setImages(response.data.images);
        onImageLoad?.();
      }
    } catch (err) {
      // No existing images, that's okay
      console.log('No existing images for step');
    } finally {
      setHasChecked(true);
    }
  };

  const generateImages = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/projects/${projectId}/steps/${stepId}/generate-images`
      );
      
      if (response.data.success && response.data.images.length > 0) {
        setImages(response.data.images);
        onImageLoad?.();
      } else {
        setError(response.data.message || 'Failed to generate image');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.response?.data?.detail || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      animateTransition(() => setCurrentIndex(currentIndex + 1));
    }
  };

  const prevImage = () => {
    if (currentIndex > 0) {
      animateTransition(() => setCurrentIndex(currentIndex - 1));
    }
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(callback, 150);
  };

  // Don't render anything until we've checked for existing images
  if (!hasChecked) {
    return null;
  }

  // No images yet - show generate button
  if (images.length === 0) {
    return (
      <View style={styles.generateContainer}>
        {generating ? (
          <View style={styles.generatingState}>
            <ActivityIndicator size="large" color={HOUZZ_GREEN} />
            <Text style={styles.generatingText}>Generating illustration...</Text>
            <Text style={styles.generatingSubtext}>This may take 10-20 seconds</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <MaterialIcons name="error-outline" size={32} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={generateImages}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.generateButton} onPress={generateImages}>
            <MaterialIcons name="auto-awesome" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>Generate AI Illustration</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show slideshow
  return (
    <View style={styles.slideshowContainer}>
      <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: images[currentIndex] }}
          style={styles.slideImage}
          resizeMode="cover"
        />
        
        {/* AI Badge */}
        <View style={styles.aiBadge}>
          <MaterialIcons name="auto-awesome" size={12} color="#fff" />
          <Text style={styles.aiBadgeText}>AI Generated</Text>
        </View>
      </Animated.View>

      {/* Navigation (if multiple images) */}
      {images.length > 1 && (
        <View style={styles.navOverlay}>
          <TouchableOpacity 
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]} 
            onPress={prevImage}
            disabled={currentIndex === 0}
          >
            <MaterialIcons name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.dotsContainer}>
            {images.map((_, idx) => (
              <View 
                key={idx} 
                style={[styles.dot, idx === currentIndex && styles.dotActive]} 
              />
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.navButton, currentIndex === images.length - 1 && styles.navButtonDisabled]} 
            onPress={nextImage}
            disabled={currentIndex === images.length - 1}
          >
            <MaterialIcons name="chevron-right" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  generateContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HOUZZ_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  generatingState: {
    alignItems: 'center',
    gap: 12,
  },
  generatingText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  generatingSubtext: {
    color: '#888',
    fontSize: 12,
  },
  errorState: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  slideshowContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  navOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
});
