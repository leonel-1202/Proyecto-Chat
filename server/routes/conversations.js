import { Router } from 'express';
import Conversation from '../models/Conversation.js';
import Message      from '../models/Message.js';

const router = Router();

export function makeChatId(a, b) {
    return [a, b].sort().join('__');
}

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

router.post('/', async (req, res) => {
    try {
        const { myPhone, myNombre, theirPhone, theirNombre } = req.body;
        if (!myPhone || !theirPhone) {
            return res.status(400).json({ error: 'myPhone y theirPhone requeridos' });
        }

        const chatId = makeChatId(myPhone, theirPhone);

        let conv = await Conversation.findOne({ chatId });

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

router.patch('/:chatId', async (req, res) => {
    try {
        const conv = await Conversation.findOneAndUpdate(
            { chatId: req.params.chatId },
            { $set: { lastMessage: req.body.lastMessage, lastTime: req.body.lastTime } },
            { returnDocument: 'after' }
        );
        res.json(conv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;