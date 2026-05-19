import express    from 'express';
import http       from 'http';
import path       from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import mongoose   from 'mongoose';
import cors       from 'cors';
import dotenv     from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import Message      from './models/Message.js';
import Group        from './models/Group.js';
import Status       from './models/Status.js';
import Conversation from './models/Conversation.js';

import messagesRouter                       from './routes/messages.js';
import groupsRouter                         from './routes/groups.js';
import statusRouter                         from './routes/status.js';
import conversationsRouter, { makeChatId } from './routes/conversations.js';

const app    = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '15mb' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ MongoDB error:', err));

app.use('/api/messages',      messagesRouter);
app.use('/api/groups',        groupsRouter);
app.use('/api/status',        statusRouter);
app.use('/api/conversations', conversationsRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);

  socket.on('register', (phone) => {
    connectedUsers.set(phone, socket.id);
    socket.data.phone = phone;
    io.emit('user_online', { phone });
    console.log(`📱 Registrado: ${phone}`);
  });

  socket.on('join_chat',  (chatId)  => socket.join(`chat_${chatId}`));
  socket.on('join_group', (groupId) => socket.join(`group_${groupId}`));

  socket.on('create_conversation', async ({ myPhone, myNombre, theirPhone, theirNombre }) => {
    try {
      const chatId = makeChatId(myPhone, theirPhone);
      const conv = await Conversation.findOneAndUpdate(
        { chatId },
        {
          $setOnInsert: {
            chatId,
            participants: [
              { phone: myPhone,    nombre: myNombre    || myPhone },
              { phone: theirPhone, nombre: theirNombre || theirPhone },
            ],
          },
        },
        { upsert: true, new: true }
      );
      socket.join(`chat_${chatId}`);
      socket.emit('conversation_ready', conv);

      const theirSocketId = connectedUsers.get(theirPhone);
      if (theirSocketId) {
        const theirSocket = io.sockets.sockets.get(theirSocketId);
        if (theirSocket) {
          theirSocket.join(`chat_${chatId}`);
          theirSocket.emit('new_conversation', conv);
        }
      }
    } catch (err) {
      console.error('Error create_conversation:', err);
      socket.emit('error', { msg: 'No se pudo crear la conversación' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const saved = await Message.create({
        chatId:  data.chatId,
        type:    data.type,
        text:    data.text    || '',
        media:   data.media   || null,
        sender:  data.sender,
        replyTo: data.replyTo || null,
        status:  'sent',
      });
      await Conversation.findOneAndUpdate(
        { chatId: data.chatId },
        { $set: { lastMessage: data.text || '📎', lastTime: saved.time, updatedAt: new Date() } }
      );
      io.to(`chat_${data.chatId}`).emit('new_message', saved);
    } catch (err) {
      console.error('Error send_message:', err);
      socket.emit('error', { msg: 'No se pudo enviar el mensaje' });
    }
  });

  socket.on('send_media_message', async (data) => {
    try {
      const saved = await Message.create({
        chatId:  data.chatId,
        type:    data.type,
        text:    data.text   || '',
        media:   data.media,
        sender:  data.sender,
        replyTo: data.replyTo || null,
        status:  'sent',
      });
      await Conversation.findOneAndUpdate(
        { chatId: data.chatId },
        { $set: { lastMessage: '📎 Archivo', lastTime: saved.time, updatedAt: new Date() } }
      );
      io.to(`chat_${data.chatId}`).emit('new_message', saved);
    } catch (err) {
      console.error('Error send_media_message:', err);
      socket.emit('error', { msg: 'No se pudo enviar el archivo' });
    }
  });

  socket.on('send_group_message', async (data) => {
    try {
      const saved = await Message.create({
        groupId: data.groupId,
        type:    'out',
        text:    data.text   || '',
        media:   data.media  || null,
        sender:  data.sender,
        replyTo: data.replyTo || null,
        status:  'sent',
      });
      io.to(`group_${data.groupId}`).emit('new_group_message', saved);
    } catch (err) {
      console.error('Error send_group_message:', err);
      socket.emit('error', { msg: 'No se pudo enviar el mensaje de grupo' });
    }
  });

  socket.on('mark_read', async ({ messageIds, chatId, groupId, phone }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds }, readBy: { $ne: phone } },
        { $addToSet: { readBy: phone }, $set: { status: 'read' } }
      );
      const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
      io.to(room).emit('messages_read', { messageIds, phone });
    } catch (err) { console.error('Error mark_read:', err); }
  });

  socket.on('react_message', async ({ messageId, emoji, phone, chatId, groupId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const existing = msg.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.users.includes(phone)) {
          existing.users = existing.users.filter((u) => u !== phone);
          if (existing.users.length === 0)
            msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        } else {
          existing.users.push(phone);
        }
      } else {
        msg.reactions.push({ emoji, users: [phone] });
      }
      await msg.save();
      const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
      io.to(room).emit('message_reaction', { messageId, reactions: msg.reactions });
    } catch (err) { console.error('Error react_message:', err); }
  });

  socket.on('typing', ({ chatId, groupId, phone, nombre }) => {
    const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
    socket.to(room).emit('typing', { phone, nombre });
  });
  socket.on('stop_typing', ({ chatId, groupId, phone }) => {
    const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
    socket.to(room).emit('stop_typing', { phone });
  });

  socket.on('disconnect', () => {
    const phone = socket.data.phone;
    if (phone) {
      connectedUsers.delete(phone);
      io.emit('user_offline', { phone });
      console.log(`🔴 Desconectado: ${phone}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));