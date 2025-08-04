
interface Message {
  id: number;
  text: string;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  created_at: string;
  read_at?: string;
}

interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error?: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: ((message: Message) => void)[] = [];
  private connectionListeners: ((state: ConnectionState) => void)[] = [];
  private currentUserId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private wsUrl = '';

  connect(userId: number, wsUrl: string = 'wss://23498ded-965e-4cce-9361-313fcb4dc5d8-00-1pa7u3fhwqfqq.worf.replit.dev') {
    this.currentUserId = userId;
    this.wsUrl = wsUrl;
    
    this.notifyConnectionListeners({ connected: false, connecting: true });

    try {
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }

      const socketUrl = `${wsUrl}?userId=${userId}`;
      console.log('Connecting to WebSocket:', socketUrl);
      
      this.socket = new WebSocket(socketUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connesso');
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners({ connected: true, connecting: false });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const message: Message = data.message;
            this.listeners.forEach(listener => listener(message));
          } else if (data.type === 'error') {
            console.error('WebSocket error message:', data.error);
            this.notifyConnectionListeners({ 
              connected: false, 
              connecting: false, 
              error: data.error 
            });
          }
        } catch (error) {
          console.error('Errore parsing messaggio WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('Errore WebSocket:', error);
        this.notifyConnectionListeners({ 
          connected: false, 
          connecting: false, 
          error: 'Connection error' 
        });
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnesso:', event.code, event.reason);
        this.notifyConnectionListeners({ connected: false, connecting: false });
        
        // Auto-reconnect se non è stata una disconnessione intenzionale
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`Tentativo di riconnessione in ${delay}ms...`);
          
          setTimeout(() => {
            if (this.currentUserId) {
              this.reconnectAttempts++;
              this.connect(this.currentUserId, this.wsUrl);
            }
          }, delay);
        }
      };
    } catch (error) {
      console.error('Errore connessione WebSocket:', error);
      this.notifyConnectionListeners({ 
        connected: false, 
        connecting: false, 
        error: 'Failed to create connection' 
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Disconnessione volontaria');
      this.socket = null;
    }
    this.listeners = [];
    this.connectionListeners = [];
    this.currentUserId = null;
    this.reconnectAttempts = 0;
  }

  sendMessage(receiverId: number, text: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.currentUserId) {
      console.warn('WebSocket non connesso o userId mancante');
      return false;
    }

    try {
      const messageData = {
        type: 'send_message',
        data: {
          senderId: this.currentUserId,
          receiverId: receiverId,
          text: text
        }
      };
      
      this.socket.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      return false;
    }
  }

  onMessage(callback: (message: Message) => void) {
    this.listeners.push(callback);
    
    // Return cleanup function
    return () => {
      this.removeMessageListener(callback);
    };
  }

  removeMessageListener(callback: (message: Message) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  onConnectionChange(callback: (state: ConnectionState) => void) {
    this.connectionListeners.push(callback);
    
    // Return cleanup function
    return () => {
      this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
    };
  }

  markAsRead(messageId: number): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket non connesso per markAsRead');
      return false;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'mark_read',
        messageId: messageId
      }));
      return true;
    } catch (error) {
      console.error('Errore mark as read:', error);
      return false;
    }
  }

  getConnectionState(): ConnectionState {
    return {
      connected: this.socket?.readyState === WebSocket.OPEN,
      connecting: this.socket?.readyState === WebSocket.CONNECTING
    };
  }

  private notifyConnectionListeners(state: ConnectionState) {
    this.connectionListeners.forEach(listener => listener(state));
  }

  // Utility method to check if WebSocket is ready
  isReady(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Method to force reconnection
  forceReconnect() {
    if (this.currentUserId) {
      this.disconnect();
      this.connect(this.currentUserId, this.wsUrl);
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default WebSocketService;

// Export types
export type { Message, ConnectionState };
