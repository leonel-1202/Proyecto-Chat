import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// ── CAMBIO: una sola llamada a dotenv con path explícito hacia la raíz ────────
// Antes había dos dotenv.config() que se pisaban entre sí
dotenv.config({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import Message      from './models/Message.js';
import Group        from './models/Group.js';
import Status       from './models/Status.js';
import Conversation from './models/Conversation.js';
import conversationsRouter, { makeChatId } from './routes/conversations.js';
import messagesRouter from './routes/messages.js';
import groupsRouter   from './routes/groups.js';
import statusRouter   from './routes/status.js';

const app    = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://nexus-cfkp.onrender.com',
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '15mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/messages',      messagesRouter);
app.use('/api/groups',        groupsRouter);
app.use('/api/status',        statusRouter);
app.use('/api/conversations', conversationsRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function obtenerRespuestaInteligente(mensajeUsuario) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY no definida');
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente útil, te llamas Nexus y estas en chat grupal abierto donde cualquier número puede interactuar contigo y los demás integrantes. Responde siempre en español.',
      },
      { role: 'user', content: mensajeUsuario },
    ],
  });
  return response.choices[0].message.content;
}

const connectedUsers = new Map();
const horaActual = () =>
  new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

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

  socket.on('send_message', async (data) => {
    try {
      const saved = await Message.create({
        chatId:  data.chatId,
        type:    data.type    || 'out',
        text:    data.text    || '',
        media:   data.media   || null,
        sender:  data.sender,
        replyTo: data.replyTo || null,
        status:  'sent',
      });

      await Conversation.findOneAndUpdate(
        { chatId: data.chatId },
        { $set: { lastMessage: data.text || '📎', lastTime: saved.time || horaActual(), updatedAt: new Date() } }
      );

      io.to(`chat_${data.chatId}`).emit('new_message', saved);

      if (data.chatId === 'bot_nexus') {
        try {
          const respuestaIA = await obtenerRespuestaInteligente(data.text);
          const botMsg = await Message.create({
            chatId: 'bot_nexus',
            type:   'in',
            text:   respuestaIA,
            sender: '+570000000000',
            status: 'read',
          });
          socket.emit('new_message', botMsg);
        } catch (groqError) {
          console.error('🔴 Error Groq:', groqError);
        }
      }
    } catch (err) {
      console.error('Error send_message:', err);
      socket.emit('error', { msg: 'No se pudo enviar el mensaje' });
    }
  });

  socket.on('send_media_message', async (data) => {
    try {
      const saved = await Message.create({
        chatId:  data.chatId,
        type:    data.type   || 'out',
        text:    data.text   || '',
        media:   data.media,
        sender:  data.sender,
        replyTo: data.replyTo || null,
        status:  'sent',
      });
      await Conversation.findOneAndUpdate(
        { chatId: data.chatId },
        { $set: { lastMessage: '📎 Archivo', lastTime: saved.time || horaActual(), updatedAt: new Date() } }
      );
      io.to(`chat_${data.chatId}`).emit('new_message', saved);
    } catch (err) {
      console.error('Error send_media_message:', err);
      socket.emit('error', { msg: 'No se pudo enviar el archivo' });
    }
  });

  socket.on('create_conversation', async ({ myPhone, myNombre, theirPhone, theirNombre }) => {
    try {
      const chatId = makeChatId(myPhone, theirPhone);
      const conv   = await Conversation.findOneAndUpdate(
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
        { upsert: true, returnDocument: 'after' }
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

  socket.on('edit_message', async ({ messageId, text, chatId, groupId }) => {
    try {
      const msg = await Message.findByIdAndUpdate(
        messageId, { $set: { text, edited: true } }, { new: true }
      );
      if (!msg) return;
      const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
      io.to(room).emit('message_edited', { messageId, text, edited: true });
    } catch (err) { console.error('Error edit_message:', err); }
  });

  socket.on('delete_message', async ({ messageId, chatId, groupId, forEveryone }) => {
    try {
      const update = forEveryone
        ? { $set: { deleted: true, text: '', media: null } }
        : { $set: { deleted: true } };
      await Message.findByIdAndUpdate(messageId, update);
      const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
      io.to(room).emit('message_deleted', { messageId, forEveryone });
    } catch (err) { console.error('Error delete_message:', err); }
  });

  socket.on('clear_chat', async ({ chatId, phone }) => {
    try {
      await Message.deleteMany({ chatId });
      io.to(`chat_${chatId}`).emit('chat_cleared', { chatId, by: phone });
    } catch (err) {
      console.error('Error clear_chat:', err);
      socket.emit('error', { msg: 'No se pudo vaciar el chat' });
    }
  });

  socket.on('typing', ({ chatId, groupId, phone, nombre }) => {
    const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
    socket.to(room).emit('typing', { phone, nombre });
  });

  socket.on('stop_typing', ({ chatId, groupId, phone }) => {
    const room = chatId ? `chat_${chatId}` : `group_${groupId}`;
    socket.to(room).emit('stop_typing', { phone });
  });

  socket.on('call_offer', ({ to, from, nombre, type, offer }) => {
    const toSocketId = connectedUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('call_offer', { from, nombre, type, offer });
    } else {
      socket.emit('call_end', { reason: 'unavailable' });
    }
  });

  socket.on('call_answer', ({ to, from, answer }) => {
    const toSocketId = connectedUsers.get(to);
    if (toSocketId) io.to(toSocketId).emit('call_answer', { from, answer });
  });

  socket.on('call_ice_candidate', ({ to, from, candidate }) => {
    const toSocketId = connectedUsers.get(to);
    if (toSocketId) io.to(toSocketId).emit('call_ice_candidate', { from, candidate });
  });

  socket.on('call_end', ({ to, from, reason }) => {
    const toSocketId = connectedUsers.get(to);
    if (toSocketId) io.to(toSocketId).emit('call_end', { from, reason });
  });

  socket.on('disconnect', () => {
    const phone = socket.data.phone;
    if (phone) {
      connectedUsers.delete(phone);
      io.emit('user_offline', { phone, lastSeen: new Date().toISOString() });
      console.log(`🔴 Desconectado: ${phone}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));