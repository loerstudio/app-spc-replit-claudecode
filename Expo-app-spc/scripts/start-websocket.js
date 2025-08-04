
#!/usr/bin/env node

const { Server } = require('socket.io');
const { createServer } = require('http');

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Mock database per testing
const mockMessages = [];
let messageIdCounter = 1;

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`🔌 Utente ${userId} connesso`);

  // Join room personale
  socket.join(`user_${userId}`);

  socket.on('send_message', async (data) => {
    try {
      // Simula salvataggio messaggio
      const message = {
        id: messageIdCounter++,
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        text: data.text,
        created_at: new Date().toISOString(),
        sender_name: data.senderId === 1 ? 'Tu' : 'Mario Coach'
      };
      
      mockMessages.push(message);
      
      // Invia a entrambi gli utenti
      io.to(`user_${data.senderId}`).emit('new_message', message);
      io.to(`user_${data.receiverId}`).emit('new_message', message);
      
      console.log(`📩 Messaggio inviato da ${data.senderId} a ${data.receiverId}`);
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
    }
  });

  socket.on('mark_read', async (messageId) => {
    try {
      // Simula marcatura come letto
      const messageIndex = mockMessages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        mockMessages[messageIndex].read_at = new Date().toISOString();
      }
      
      socket.broadcast.emit('message_read', messageId);
      console.log(`✅ Messaggio ${messageId} marcato come letto`);
    } catch (error) {
      console.error('❌ Errore marcatura lettura:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Utente ${userId} disconnesso`);
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket server in ascolto su porta ${PORT}`);
});
