import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const HOUZZ_GREEN = '#3dae2b';
const HANK_AVATAR = '🔧';

interface ChatMessage {
  id: string;
  role: 'user' | 'handy_hank';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  image_base64: string;
  thumbnail_base64: string;
  initial_description: string;
  messages: ChatMessage[];
  is_complete: boolean;
  project_id: string | null;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingDots = useRef(new Animated.Value(0)).current;

  // Get params
  const imageBase64 = params.image_base64 as string;
  const thumbnailBase64 = params.thumbnail_base64 as string;
  const description = params.description as string;
  const conversationId = params.conversation_id as string;

  useEffect(() => {
    if (conversationId) {
      // Resume existing conversation
      fetchConversation(conversationId);
    } else if (imageBase64) {
      // Start new conversation
      startConversation();
    } else {
      setError('No image provided');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Typing animation
    if (sending) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingDots, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingDots.setValue(0);
    }
  }, [sending]);

  const fetchConversation = async (id: string) => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/conversations/${id}`);
      setConversation(response.data.conversation);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async () => {
    try {
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/conversations`, {
        image_base64: imageBase64,
        thumbnail_base64: thumbnailBase64 || '',
        description: description || '',
      });
      setConversation(response.data.conversation);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !conversation || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    
    setConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempUserMessage]
    } : null);

    try {
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/conversations/${conversation.id}/chat`,
        { message: messageText }
      );

      const { message: hankMessage, is_complete, project_id } = response.data;

      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages.filter(m => m.id !== tempUserMessage.id), 
          { ...tempUserMessage, id: `user-${Date.now()}` },
          hankMessage
        ],
        is_complete,
        project_id,
      } : null);

      // If conversation is complete, navigate to project after a short delay
      if (is_complete && project_id) {
        setTimeout(() => {
          router.replace({
            pathname: '/project',
            params: { projectId: project_id }
          });
        }, 2000);
      }

    } catch (err: any) {
      console.error('Send message error:', err);
      // Remove optimistic message on error
      setConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempUserMessage.id)
      } : null);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const forceComplete = async () => {
    if (!conversation) return;
    
    setSending(true);
    try {
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/conversations/${conversation.id}/complete`
      );
      
      const project = response.data.project;
      router.replace({
        pathname: '/project',
        params: { projectId: project.id }
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate project');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isHank = item.role === 'handy_hank';
    
    return (
      <View style={[styles.messageRow, isHank ? styles.hankRow : styles.userRow]}>
        {isHank && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{HANK_AVATAR}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isHank ? styles.hankBubble : styles.userBubble]}>
          {isHank && <Text style={styles.hankName}>Handy Hank</Text>}
          <Text style={[styles.messageText, isHank ? styles.hankText : styles.userText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={HOUZZ_GREEN} />
          <Text style={styles.loadingText}>Connecting with Handy Hank...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerAvatar}>{HANK_AVATAR}</Text>
          <View>
            <Text style={styles.headerTitle}>Handy Hank</Text>
            <Text style={styles.headerSubtitle}>Your DIY Expert</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={forceComplete} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {conversation?.thumbnail_base64 && (
        <View style={styles.imagePreview}>
          <Image 
            source={{ uri: conversation.thumbnail_base64 }} 
            style={styles.previewImage}
          />
          <Text style={styles.previewText}>
            {conversation.initial_description || 'Your repair issue'}
          </Text>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages with Keyboard Handling */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.messagesWrapper}>
            <FlatList
              ref={flatListRef}
              data={conversation?.messages || []}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            />

        {/* Typing Indicator */}
        {sending && (
          <View style={styles.typingContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{HANK_AVATAR}</Text>
            </View>
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
            </View>
          </View>
        )}

        {/* Completion Banner */}
        {conversation?.is_complete && (
          <View style={styles.completeBanner}>
            <MaterialIcons name="check-circle" size={24} color={HOUZZ_GREEN} />
            <Text style={styles.completeText}>
              Creating your personalized repair plan...
            </Text>
          </View>
        )}
          </View>
        </TouchableWithoutFeedback>

        {/* Input Area */}
        {!conversation?.is_complete && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
            >
              <MaterialIcons 
                name="send" 
                size={24} 
                color={inputText.trim() && !sending ? '#fff' : '#ccc'} 
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: HOUZZ_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ef4444',
    padding: 12,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  hankRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    fontSize: 20,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  hankBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: HOUZZ_GREEN,
    borderBottomRightRadius: 4,
  },
  hankName: {
    fontSize: 12,
    fontWeight: '600',
    color: HOUZZ_GREEN,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  hankText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 8,
  },
  completeText: {
    fontSize: 15,
    color: HOUZZ_GREEN,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOUZZ_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});
