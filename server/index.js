import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Message from './models/Message.js';
import Group from './models/Group.js';
import Status from './models/Status.js';
import Conversation from './models/Conversation.js';

import messagesRouter from './routes/messages.js';
import groupsRouter from './routes/groups.js';
import statusRouter from './routes/status.js';
import conversationsRouter, {
  makeChatId
} from './routes/conversations.js';

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'https://nexus-cfkp.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '15mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/messages', messagesRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/status', statusRouter);
app.use('/api/conversations', conversationsRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

async function obtenerRespuestaInteligente(mensajeUsuario) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY no definida');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: mensajeUsuario
  });

  return response.text || 'No pude generar respuesta.';
}

const connectedUsers = new Map();

io.on('connection', socket => {
  console.log('🟢 Cliente conectado:', socket.id);

  socket.on('send_message', async data => {
    try {
      const horaActual = new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const esBot = data.sender === '+570000000000';

      const saved = await Message.create({
        chatId: data.chatId,
        type: data.type || (esBot ? 'in' : 'out'),
        text: data.text || '',
        media: data.media || null,
        sender: data.sender,
        replyTo: data.replyTo || null,
        status: 'sent'
      });

      await Conversation.findOneAndUpdate(
        { chatId: data.chatId },
        {
          $set: {
            lastMessage: data.text || '📎',
            lastTime: saved.time || horaActual,
            updatedAt: new Date()
          }
        }
      );

      io.to(`chat_${data.chatId}`).emit('new_message', saved);

      const esChatBot =
        typeof data.chatId === 'string' &&
        data.chatId.startsWith('bot_nexus_');

      if (esChatBot && !esBot) {
        try {
          const respuestaIA =
            await obtenerRespuestaInteligente(data.text);

          const respuestaGuardada =
            await Message.create({
              chatId: data.chatId,
              type: 'in',
              text: respuestaIA,
              sender: '+570000000000',
              status: 'read'
            });

          await Conversation.findOneAndUpdate(
            { chatId: data.chatId },
            {
              $set: {
                lastMessage: respuestaIA,
                updatedAt: new Date()
              }
            }
          );

          io.to(`chat_${data.chatId}`).emit(
            'new_message',
            respuestaGuardada
          );

        } catch (geminiError) {
          console.error(
            '🔴 Error Gemini:',
            geminiError
          );

          const respuestaError =
            await Message.create({
              chatId: data.chatId,
              type: 'in',
              text:
                'Lo siento, tuve un problema temporal al responder.',
              sender: '+570000000000',
              status: 'read'
            });

          io.to(`chat_${data.chatId}`).emit(
            'new_message',
            respuestaError
          );
        }
      }

    } catch (err) {
      console.error('Error send_message:', err);

      socket.emit('error', {
        msg: 'No se pudo enviar el mensaje'
      });
    }
  });

  socket.on('register', phone => {
    connectedUsers.set(phone, socket.id);
    socket.data.phone = phone;
    io.emit('user_online', { phone });
  });

  socket.on('join_chat',
    chatId => socket.join(`chat_${chatId}`)
  );

  socket.on('join_group',
    groupId => socket.join(`group_${groupId}`)
  );

  socket.on(
    'create_conversation',
    async ({
      myPhone,
      myNombre,
      theirPhone,
      theirNombre
    }) => {
      try {
        const chatId =
          theirPhone === '+570000000000'
            ? `bot_nexus_${myPhone}`
            : makeChatId(myPhone, theirPhone);

        const conv =
          await Conversation.findOneAndUpdate(
            { chatId },
            {
              $setOnInsert: {
                chatId,
                participants: [
                  {
                    phone: myPhone,
                    nombre: myNombre || myPhone
                  },
                  {
                    phone: theirPhone,
                    nombre: theirNombre || theirPhone
                  }
                ]
              }
            },
            {
              upsert: true,
              returnDocument: 'after'
            }
          );

        socket.join(`chat_${chatId}`);
        socket.emit(
          'conversation_ready',
          conv
        );

        const theirSocketId =
          connectedUsers.get(theirPhone);

        if (theirSocketId) {
          const theirSocket =
            io.sockets.sockets.get(
              theirSocketId
            );

          if (theirSocket) {
            theirSocket.join(
              `chat_${chatId}`
            );

            theirSocket.emit(
              'new_conversation',
              conv
            );
          }
        }

      } catch (err) {
        console.error(
          'Error create_conversation:',
          err
        );
      }
    }
  );

  socket.on('disconnect', () => {
    const phone = socket.data.phone;

    if (phone) {
      connectedUsers.delete(phone);

      io.emit('user_offline', {
        phone,
        lastSeen:
          new Date().toISOString()
      });

      console.log(
        `🔴 Desconectado: ${phone}`
      );
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `🚀 Servidor corriendo en puerto ${PORT}`
  );
});