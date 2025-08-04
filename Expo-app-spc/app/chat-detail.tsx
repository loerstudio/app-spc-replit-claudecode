import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import WebSocketService from '@/lib/websocket';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { VideoView, useVideoPlayer } from 'expo-video';

interface Message {
  id: number;
  text: string;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  timestamp: string;
  read_at?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  media_thumbnail?: string;
}

export default function ChatDetailScreen() {
  const { userId, userName } = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  const [message, setMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);

  const currentUserId = 1; // Simulato - dovrebbe venire da auth

  useEffect(() => {
    // Connetti WebSocket
    const socket = WebSocketService.connect(currentUserId);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Ascolta nuovi messaggi
    WebSocketService.onNewMessage((newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    });

    // Ascolta messaggi letti
    WebSocketService.onMessageRead((messageId: number) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
        )
      );
    });

    // Carica messaggi esistenti
    loadMessages();

    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // Mock messages for now
      const mockMessages: Message[] = [
        {
          id: 1,
          text: 'Ciao! Come è andato l\'allenamento di ieri?',
          sender_id: parseInt(userId as string),
          receiver_id: currentUserId,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          sender_name: userName as string
        },
        {
          id: 2,
          text: 'È andato molto bene! Ho completato tutti gli esercizi',
          sender_id: currentUserId,
          receiver_id: parseInt(userId as string),
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          sender_name: 'Tu'
        },
        {
          id: 3,
          text: 'Perfetto! Domani gambe 💪',
          sender_id: parseInt(userId as string),
          receiver_id: currentUserId,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          sender_name: userName as string
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Errore caricamento messaggi:', error);
      Alert.alert('Errore', 'Impossibile caricare i messaggi');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    const messageText = message.trim() || newMessage.trim();
    if (!messageText) return;

    const newMsg: Message = {
      id: messages.length + 1,
      text: messageText,
      sender_id: currentUserId,
      receiver_id: parseInt(userId as string),
      timestamp: new Date().toISOString(),
      sender_name: 'Tu'
    };

    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setNewMessage('');

    // Send via WebSocket if connected
    if (isConnected) {
      WebSocketService.sendMessage(Number(userId), messageText);
    }

    scrollToBottom();
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert('Permessi necessari', 'Serve accesso a fotocamera e galleria per inviare media');
      return false;
    }
    return true;
  };

  const compressImage = async (uri: string): Promise<string> => {
    // Simula compressione - in produzione usare react-native-image-resizer
    return uri;
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video'): Promise<string> => {
    // Simula upload a S3 - in produzione implementare upload reale
    setIsUploading(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        setIsUploading(false);
        resolve(`https://fake-s3-url.com/${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`);
      }, 2000);
    });
  };

  const selectFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaType = asset.type === 'video' ? 'video' : 'image';

      try {
        let processedUri = asset.uri;
        if (mediaType === 'image') {
          processedUri = await compressImage(asset.uri);
        }

        const uploadedUrl = await uploadMedia(processedUri, mediaType);

        const mediaMessage = {
          text: mediaType === 'image' ? '📷 Foto' : '🎥 Video',
          media_url: uploadedUrl,
          media_type: mediaType,
          media_thumbnail: mediaType === 'video' ? asset.uri : undefined,
        };

        if (isConnected) {
          WebSocketService.sendMediaMessage(Number(userId), mediaMessage);
        }
        scrollToBottom();
      } catch (error) {
        Alert.alert('Errore', 'Impossibile inviare il file');
      }
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaType = asset.type === 'video' ? 'video' : 'image';

      try {
        let processedUri = asset.uri;
        if (mediaType === 'image') {
          processedUri = await compressImage(asset.uri);
        }

        const uploadedUrl = await uploadMedia(processedUri, mediaType);

        const mediaMessage = {
          text: mediaType === 'image' ? '📷 Foto' : '🎥 Video',
          media_url: uploadedUrl,
          media_type: mediaType,
          media_thumbnail: mediaType === 'video' ? asset.uri : undefined,
        };

        if (isConnected) {
          WebSocketService.sendMediaMessage(Number(userId), mediaMessage);
        }
        scrollToBottom();
      } catch (error) {
        Alert.alert('Errore', 'Impossibile inviare il file');
      }
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Invia Media',
      'Scegli come vuoi inviare foto o video',
      [
        { text: 'Fotocamera', onPress: takePhoto },
        { text: 'Galleria', onPress: selectFromGallery },
        { text: 'Annulla', style: 'cancel' },
      ]
    );
  };

  const openMediaPreview = (url: string, type: 'image' | 'video') => {
    setPreviewMedia(url);
    setPreviewType(type);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (senderId: number) => senderId === currentUserId;

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMsg = item.sender_id === currentUserId;

    return (
      <Animated.View entering={FadeInUp.delay(index * 50)}>
        <View style={[
          styles.messageContainer,
          isMyMsg ? styles.myMessage : styles.otherMessage
        ]}>
          {/* Media content */}
          {item.media_url && (
            <TouchableOpacity 
              style={styles.mediaContainer}
              onPress={() => openMediaPreview(item.media_url!, item.media_type!)}
            >
              {item.media_type === 'image' ? (
                <Image source={{ uri: item.media_url }} style={styles.messageImage} />
              ) : (
                <View style={styles.videoContainer}>
                  <Image 
                    source={{ uri: item.media_thumbnail || item.media_url }} 
                    style={styles.messageImage} 
                  />
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={20} color={Colors.light.buttonText} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          <Text style={[
            styles.messageText,
            isMyMsg ? styles.myMessageText : styles.otherMessageText,
            item.media_url && styles.mediaMessageText
          ]}>
            {item.text}
          </Text>

          <Text style={[
            styles.messageTime,
            isMyMsg ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {new Date(item.timestamp).toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>

          {isMyMsg && (
            <Ionicons 
              name={item.read_at ? "checkmark-done" : "checkmark"} 
              size={16} 
              color={item.read_at ? "#4CAF50" : Colors.light.buttonText}
              style={styles.readIcon}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.buttonText} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {(userName as string)?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={20} color={Colors.light.buttonText} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input messaggio */}
      <Animated.View entering={FadeInDown} style={styles.inputContainer}>
        <View style={styles.inputBox}>
          <TouchableOpacity onPress={showMediaOptions} style={styles.mediaButton}>
            <Ionicons name="camera" size={24} color={Colors.light.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            placeholder="Scrivi un messaggio..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />

          <TouchableOpacity 
            onPress={sendMessage} 
            style={styles.sendButton}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? Colors.light.buttonText : Colors.light.text + '80'} 
            />
          </TouchableOpacity>
        </View>

        {isUploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.uploadingText}>Caricamento...</Text>
          </View>
        )}
      </Animated.View>

      {/* Modal anteprima media */}
      <Modal visible={previewMedia !== null} transparent={true}>
        <View style={styles.previewModal}>
          <TouchableOpacity 
            style={styles.previewCloseButton}
            onPress={() => {setPreviewMedia(null); setPreviewType(null);}}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {previewType === 'image' && previewMedia && (
            <Image source={{ uri: previewMedia }} style={styles.previewImage} />
          )}

          {previewType === 'video' && previewMedia && (
            <VideoView
              player={useVideoPlayer(previewMedia, player => {
                player.loop = false;
                player.play();
              })}
              style={styles.previewVideo}
              allowsFullscreen
              allowsPictureInPicture
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: Colors.light.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.buttonText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.buttonText,
  },
  headerStatus: {
    fontSize: 14,
    color: Colors.light.buttonText,
    opacity: 0.8,
  },
  callButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.light.buttonText,
  },
  otherMessageText: {
    color: Colors.light.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.light.buttonText,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: Colors.light.text,
    opacity: 0.6,
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 30,
    backgroundColor: Colors.light.background,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    color: Colors.light.text,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  mediaButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mediaContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaMessageText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.primary,
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  previewVideo: {
    width: '90%',
    height: '70%',
  },
});