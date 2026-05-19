import { Router } from 'express';
import Message from '../models/Message.js';

const router = Router();

router.get('/:chatId', async (req, res) => {
  try {
    const msgs = await Message.find({ chatId: req.params.chatId }).sort('createdAt').lean();
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const msg = await Message.create(req.body);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;