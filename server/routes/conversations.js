import { Router } from 'express';
import Conversation from '../models/Conversation.js';
import Message      from '../models/Message.js';

const router = Router();

export function makeChatId(a, b) {
    return [a, b].sort().join('__');
}

// GET: Obtener conversaciones
router.get('/', async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ error: 'phone requerido' });

        const convs = await Conversation.find({ 'participants.phone': phone })
            .sort({ updatedAt: -1 }).lean();

        const withMsgs = await Promise.all(
            convs.map(async (conv) => {
                const last = await Message.findOne({ chatId: conv.chatId })
                    .sort({ createdAt: -1 }).lean();
                return { ...conv, lastMessageDoc: last || null };
            })
        );
        res.json(withMsgs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Crear conversación de forma segura sin upsert conflictivos
router.post('/', async (req, res) => {
    try {
        const { myPhone, myNombre, theirPhone, theirNombre } = req.body;
        if (!myPhone || !theirPhone) {
            return res.status(400).json({ error: 'myPhone y theirPhone requeridos' });
        }

        const chatId = makeChatId(myPhone, theirPhone);

        // 1. Buscamos primero si ya existe la conversación
        let conv = await Conversation.findOne({ chatId });

        // 2. Si no existe, la creamos limpiamente para evitar errores de duplicidad en Atlas
        if (!conv) {
            conv = await Conversation.create({
                chatId,
                participants: [
                    { phone: myPhone,    nombre: myNombre    || myPhone },
                    { phone: theirPhone, nombre: theirNombre || theirPhone },
                ]
            });
        }

        res.json(conv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH: Actualizar conversación sin advertencias obsoletas
router.patch('/:chatId', async (req, res) => {
    try {
        const conv = await Conversation.findOneAndUpdate(
            { chatId: req.params.chatId },
            { $set: { lastMessage: req.body.lastMessage, lastTime: req.body.lastTime } },
            { returnDocument: 'after' } // ◄ Cambiado 'new: true' para quitar la advertencia de Mongoose
        );
        res.json(conv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;