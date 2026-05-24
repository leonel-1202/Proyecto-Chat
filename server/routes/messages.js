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

router.patch('/:id', async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { text: req.body.text, edited: true } },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { forEveryone } = req.body;
    const update = forEveryone
      ? { $set: { deleted: true, text: '', media: null } }
      : { $set: { deleted: true } };
    const msg = await Message.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clear/:chatId', async (req, res) => {
  try {
    await Message.deleteMany({ chatId: req.params.chatId });
    res.json({ ok: true, chatId: req.params.chatId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;