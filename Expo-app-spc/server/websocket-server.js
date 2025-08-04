const WebSocket = require('ws');
const { sendMessage, getMessages, markMessageAsRead, getKey, setKey } = require('../lib/database');

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  start(port = 8080) {
    try {
      this.wss = new WebSocket.Server({ 
        port: port,
        host: '0.0.0.0'
      });

      console.log(`🔌 WebSocket Server running on ws://0.0.0.0:${port}`);

      this.wss.on('connection', (ws, request) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const userId = parseInt(url.searchParams.get('userId'));

        if (!userId) {
          ws.close(1008, 'Missing userId parameter');
          return;
        }

        console.log(`👤 User ${userId} connected to WebSocket`);

        // Store connection
        this.clients.set(userId, ws);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Successfully connected to WebSocket server',
          userId: userId
        }));

        // Handle incoming messages
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleMessage(userId, message, ws);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Invalid message format'
            }));
          }
        });

        // Handle connection close
        ws.on('close', (code, reason) => {
          console.log(`👤 User ${userId} disconnected: ${code} ${reason}`);
          this.clients.delete(userId);
        });

        // Handle connection error
        ws.on('error', (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
          this.clients.delete(userId);
        });
      });

      this.wss.on('error', (error) => {
        console.error('WebSocket Server error:', error);
      });

      return this.wss;

    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      throw error;
    }
  }

  async handleMessage(userId, message, ws) {
    try {
      switch (message.type) {
        case 'auth':
          this.clients.set(userId, ws);
          ws.send(JSON.stringify({ type: 'auth_success' }));
          break;

        case 'send_message':
          const savedMessage = await sendMessage(message.senderId, message.receiverId, message.text);
          // Send to receiver if connected
          const receiverWs = this.clients.get(message.receiverId);
          if (receiverWs) {
            receiverWs.send(JSON.stringify({
              type: 'new_message',
              message: savedMessage
            }));
          }
          ws.send(JSON.stringify({ type: 'message_sent', message: savedMessage }));
          break;

        case 'mark_read':
          await this.handleMarkAsRead(userId, message.messageId, ws);
          break;

        case 'get_chat_history':
          await this.handleGetChatHistory(userId, message.data, ws);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Internal server error'
      }));
    }
  }

  async handleMarkAsRead(userId, messageId, ws) {
    try {
      const success = await markMessageAsRead(messageId);

      ws.send(JSON.stringify({
        type: 'message_read',
        messageId: messageId,
        success: success
      }));

    } catch (error) {
      console.error('Error marking message as read:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to mark message as read'
      }));
    }
  }

  async handleGetChatHistory(userId, requestData, ws) {
    try {
      const { otherUserId } = requestData;

      if (!otherUserId) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Missing otherUserId'
        }));
        return;
      }

      const messages = await getMessages(userId, otherUserId);

      // Get user names
      const users = await getKey('users') || [];
      const messagesWithNames = messages.map(msg => {
        const sender = users.find(u => u.id === msg.sender_id);
        return {
          ...msg,
          sender_name: sender ? sender.name : 'Unknown User'
        };
      });

      ws.send(JSON.stringify({
        type: 'chat_history',
        messages: messagesWithNames,
        otherUserId: otherUserId
      }));

    } catch (error) {
      console.error('Error getting chat history:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to get chat history'
      }));
    }
  }

  broadcast(message) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  getConnectedUsersCount() {
    return this.clients.size;
  }

  getConnectedUserIds() {
    return Array.from(this.clients.keys());
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('WebSocket Server stopped');
    }
  }
}

module.exports = WebSocketServer;