import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  Animated,
  ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HOUZZ_GREEN = '#3dae2b';

interface Step {
  step_number: number;
  title: string;
  description: string;
  warning?: string;
  image_hint?: string;
}

export default function ARGuideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Parse steps from params
  const steps: Step[] = params.steps ? JSON.parse(params.steps as string) : [];
  const projectTitle = params.title as string || 'Repair Guide';
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    // Pulse animation for focus area
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color="#9ca3af" />
          <Text style={styles.permissionText}>Camera access is required for AR Guide</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (steps.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>No steps available for AR guide</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Background */}
      <CameraView style={styles.camera} facing="back" />

      {/* AR Overlay Layer */}
      <Animated.View style={[styles.overlayContainer, { opacity: fadeAnim }]}>
        {/* Experimental Badge */}
        <SafeAreaView style={styles.topSafeArea} edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.experimentalBadge}>
              <MaterialIcons name="science" size={14} color="#f59e0b" />
              <Text style={styles.experimentalText}>EXPERIMENTAL</Text>
            </View>

            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={() => setShowOverlay(!showOverlay)}
            >
              <MaterialIcons 
                name={showOverlay ? "visibility" : "visibility-off"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {showOverlay && (
          <>
            {/* Focus Area Indicator */}
            <View style={styles.focusAreaContainer}>
              <Animated.View 
                style={[
                  styles.focusArea,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={styles.focusCorner} />
                <View style={[styles.focusCorner, styles.focusCornerTR]} />
                <View style={[styles.focusCorner, styles.focusCornerBL]} />
                <View style={[styles.focusCorner, styles.focusCornerBR]} />
              </Animated.View>
              
              {currentStep?.image_hint && (
                <View style={styles.hintBubble}>
                  <MaterialIcons name="search" size={16} color="#fff" />
                  <Text style={styles.hintText}>{currentStep.image_hint}</Text>
                </View>
              )}
            </View>

            {/* Step Counter */}
            <View style={styles.stepCounterContainer}>
              <View style={styles.stepCounter}>
                <Text style={styles.stepCounterText}>
                  Step {currentStepIndex + 1} of {steps.length}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Bottom Instruction Panel */}
        <View style={styles.bottomPanel}>
          <BlurView intensity={80} tint="dark" style={styles.blurView}>
            <View style={styles.instructionContainer}>
              {/* Step Title */}
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{currentStep?.step_number}</Text>
                </View>
                <Text style={styles.stepTitle} numberOfLines={2}>
                  {currentStep?.title}
                </Text>
              </View>

              {/* Step Description */}
              <ScrollView 
                style={styles.descriptionScroll} 
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.stepDescription}>
                  {currentStep?.description}
                </Text>
                
                {/* Warning */}
                {currentStep?.warning && (
                  <View style={styles.warningBox}>
                    <MaterialIcons name="warning" size={18} color="#f59e0b" />
                    <Text style={styles.warningText}>{currentStep.warning}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Navigation Buttons */}
              <View style={styles.navButtonsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.navButton, 
                    styles.prevButton,
                    currentStepIndex === 0 && styles.navButtonDisabled
                  ]} 
                  onPress={goToPrevStep}
                  disabled={currentStepIndex === 0}
                >
                  <MaterialIcons 
                    name="chevron-left" 
                    size={24} 
                    color={currentStepIndex === 0 ? "#666" : "#fff"} 
                  />
                  <Text style={[
                    styles.navButtonText,
                    currentStepIndex === 0 && styles.navButtonTextDisabled
                  ]}>Previous</Text>
                </TouchableOpacity>

                {currentStepIndex === steps.length - 1 ? (
                  <TouchableOpacity 
                    style={[styles.navButton, styles.doneButton]} 
                    onPress={() => router.back()}
                  >
                    <MaterialIcons name="check" size={24} color="#fff" />
                    <Text style={styles.navButtonText}>Done</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.navButton, styles.nextButton]} 
                    onPress={goToNextStep}
                  >
                    <Text style={styles.navButtonText}>Next</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  experimentalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    gap: 4,
  },
  experimentalText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusArea: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    position: 'relative',
  },
  focusCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: HOUZZ_GREEN,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  focusCornerTR: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    left: undefined,
    right: 0,
  },
  focusCornerBL: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    top: undefined,
    bottom: 0,
  },
  focusCornerBR: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    top: undefined,
    left: undefined,
    bottom: 0,
    right: 0,
  },
  hintBubble: {
    position: 'absolute',
    bottom: -50,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  hintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  stepCounterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stepCounter: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurView: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  instructionContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: HOUZZ_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  descriptionScroll: {
    maxHeight: 120,
    marginBottom: 16,
  },
  stepDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#f59e0b',
    fontSize: 14,
    lineHeight: 20,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
  },
  prevButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  nextButton: {
    backgroundColor: HOUZZ_GREEN,
  },
  doneButton: {
    backgroundColor: HOUZZ_GREEN,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111',
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: HOUZZ_GREEN,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: HOUZZ_GREEN,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
