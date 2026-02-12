import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { CameraView, useCameraPermissions, CameraMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Stores URI of image or video thumbnail
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null); // Stores URI of video
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [zoom, setZoom] = useState(0); 
  const [mode, setMode] = useState<CameraMode>('picture');
  const [isRecording, setIsRecording] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // Gesture for Pinch to Zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const velocity = e.velocity / 20; 
      let newZoom = zoom + (velocity * 0.05);
      if (newZoom < 0) newZoom = 0;
      if (newZoom > 1) newZoom = 1;
      runOnJS(setZoom)(newZoom);
    });

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
      }
    })();
  }, []);

  const processImage = async (uri: string) => {
    try {
      setProcessing(true);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      return result;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const generateThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        videoUri,
        {
          time: 1000,
        }
      );
      // Process thumbnail to be consistent with image uploads (resize, compress)
      const processed = await processImage(uri);
      return processed; 
    } catch (e) {
      console.warn("Could not generate thumbnail", e);
      return null;
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="photo-camera" size={64} color="#9ca3af" />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !processing && !analyzing) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7, 
          base64: false, 
        });
        
        if (photo?.uri) {
            const processed = await processImage(photo.uri);
            setCapturedImage(`data:image/jpeg;base64,${processed.base64}`);
            setCapturedVideo(null);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
        setProcessing(false);
      }
    }
  };

  const recordVideo = async () => {
      if (cameraRef.current && !isRecording && !processing) {
          try {
              setIsRecording(true);
              const video = await cameraRef.current.recordAsync({
                  maxDuration: 10,
                  quality: '480p', // Keep size small for upload
                  mute: false
              });
              
              if (video?.uri) {
                  setProcessing(true);
                  const thumbnail = await generateThumbnail(video.uri);
                  if (thumbnail) {
                      setCapturedImage(`data:image/jpeg;base64,${thumbnail.base64}`);
                  }
                  setCapturedVideo(video.uri);
                  setProcessing(false);
              }
              setIsRecording(false); // Ensure state reset
          } catch (error) {
              console.error('Error recording video:', error);
              setIsRecording(false);
              setProcessing(false);
          }
      } else if (isRecording) {
          cameraRef.current?.stopRecording();
          setIsRecording(false);
      }
  };

  const pickImage = async () => {
    if (processing || analyzing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow videos too
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false, 
      });

      if (!result.canceled && result.assets[0].uri) {
        const asset = result.assets[0];
        setProcessing(true);
        
        if (asset.type === 'video') {
             const thumbnail = await generateThumbnail(asset.uri);
             if (thumbnail) {
                setCapturedImage(`data:image/jpeg;base64,${thumbnail.base64}`);
             }
             setCapturedVideo(asset.uri);
        } else {
             const processed = await processImage(asset.uri);
             setCapturedImage(`data:image/jpeg;base64,${processed.base64}`);
             setCapturedVideo(null);
        }
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
      setProcessing(false);
    }
  };

  const uploadAndAnalyze = async () => {
      if (!capturedImage && !capturedVideo) return;
      
      setAnalyzing(true);
      try {
          const formData = new FormData();
          
          if (capturedVideo) {
              const videoUri = capturedVideo;
              const filename = videoUri.split('/').pop() || 'video.mp4';
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `video/${match[1]}` : `video/mp4`;
              
              // @ts-ignore: FormData expects specific object structure for React Native
              formData.append('file', { uri: videoUri, name: filename, type });
              formData.append('thumbnail_base64', capturedImage || ""); 
          } else if (capturedImage) {
              // Convert base64 back to file? Or upload bytes?
              // Currently backend diagnose-upload expects a file.
              // We can rely on the old diagnose endpoint? No, let's unify.
              // Actually, we have the original processed base64. 
              // We can create a dummy file from it? No.
              // We should use the existing diagnose endpoint for Images if we want to save bandwidth, 
              // OR implement base64 handling in diagnose-upload.
              // BUT, `diagnose-upload` expects `file: UploadFile`.
              // So for Images, we should probably stick to `diagnose` (JSON) endpoint unless we want to upload the file.
              // Let's split logic.
          }
          
          formData.append('description', description);

          let response;
          if (capturedVideo) {
               response = await axios.post(
                  `${EXPO_PUBLIC_BACKEND_URL}/api/diagnose-upload`,
                  formData,
                  {
                      headers: {
                          'Content-Type': 'multipart/form-data',
                      },
                      timeout: 180000, // 3 mins for video
                  }
              );
          } else {
               // Photo flow - keep using JSON endpoint for speed/compatibility
               // Need to strip prefix
               const base64Data = capturedImage!.split(',')[1];
               response = await axios.post(
                  `${EXPO_PUBLIC_BACKEND_URL}/api/diagnose`,
                  {
                      image_base64: base64Data,
                      description: description || undefined,
                  },
                  {
                      headers: { 'Content-Type': 'application/json' },
                      timeout: 120000, 
                  }
              );
          }

          if (response.data && response.data.project) {
            await AsyncStorage.setItem('lastProjectId', response.data.project.id);
            router.push({
              pathname: '/diagnosis',
              params: { projectId: response.data.project.id }
            });
          }

      } catch (error: any) {
          console.error('Analysis error:', error);
          let errorMessage = 'Failed to analyze. Please try again.';
          if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }
          Alert.alert('Analysis Failed', errorMessage);
      } finally {
          setAnalyzing(false);
      }
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedVideo(null);
    setDescription('');
  };
  
  const toggleMode = () => {
      setMode(mode === 'picture' ? 'video' : 'picture');
  }

  if (processing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{color: 'white', marginTop: 20}}>Processing...</Text>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.previewContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.previewContentWrapper}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              {capturedVideo && (
                  <View style={styles.videoBadge}>
                      <MaterialIcons name="videocam" size={24} color="white" />
                  </View>
              )}
              <View style={styles.previewOverlay}>
                <Text style={styles.previewTitle}>Add Description (Optional)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe the issue (e.g., 'leaking faucet')..."
                  placeholderTextColor="#9ca3af"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />
                <View style={styles.previewActions}>
                  <TouchableOpacity style={[styles.actionButton, styles.retakeButton]} onPress={retake} disabled={analyzing}>
                    <MaterialIcons name="refresh" size={24} color="#ef4444" />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.analyzeButton]} onPress={() => { Keyboard.dismiss(); uploadAndAnalyze(); }} disabled={analyzing}>
                    {analyzing ? <ActivityIndicator color="#fff" /> : <><MaterialIcons name="auto-fix-high" size={24} color="#fff" /><Text style={styles.analyzeButtonText}>Analyze</Text></>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.contentContainer}>
        <GestureDetector gesture={pinchGesture}>
            <View style={styles.cameraContainer}>
                <CameraView 
                  style={styles.camera} 
                  ref={cameraRef} 
                  facing="back"
                  zoom={zoom}
                  mode={mode}
                />
            </View>
        </GestureDetector>

        <View style={styles.overlayContainer} pointerEvents="box-none">
            <View style={styles.topBar}>
               <View style={styles.modeSwitchContainer}>
                  <TouchableOpacity onPress={() => setMode('picture')} style={[styles.modeButton, mode === 'picture' && styles.activeModeButton]}>
                      <Text style={[styles.modeText, mode === 'picture' && styles.activeModeText]}>Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('video')} style={[styles.modeButton, mode === 'video' && styles.activeModeButton]}>
                      <Text style={[styles.modeText, mode === 'video' && styles.activeModeText]}>Video</Text>
                  </TouchableOpacity>
               </View>
            </View>

            <View style={styles.bottomBar} pointerEvents="auto">
              <TouchableOpacity style={styles.galleryButton} onPress={pickImage} disabled={processing || analyzing || isRecording}>
                <MaterialIcons name="photo-library" size={32} color="#fff" />
              </TouchableOpacity>

              {mode === 'picture' ? (
                  <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={processing || analyzing}>
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
              ) : (
                  <TouchableOpacity 
                    style={[styles.captureButton, { borderColor: '#ef4444' }]} 
                    onPress={recordVideo}
                    disabled={processing || analyzing}
                  >
                    <View style={[
                        styles.captureButtonInner, 
                        { backgroundColor: '#ef4444', borderRadius: isRecording ? 4 : 32, width: isRecording ? 32 : 64, height: isRecording ? 32 : 64 } 
                    ]} />
                  </TouchableOpacity>
              )}

              <View style={styles.placeholderButton} />
            </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    alignItems: 'center',
  },
  modeSwitchContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 4,
  },
  modeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
  },
  activeModeButton: {
      backgroundColor: '#10b981',
  },
  modeText: {
      color: '#d1d5db',
      fontWeight: '600',
  },
  activeModeText: {
      color: '#fff',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
  },
  placeholderButton: {
    width: 56,
    height: 56,
  },
  previewContainer: {
    flex: 1,
    width: '100%',
  },
  previewContentWrapper: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoBadge: {
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 8,
      borderRadius: 20,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    paddingBottom: 32,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  retakeButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#10b981',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
