import { Router } from 'express';
import Status from '../models/Status.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const estados = await Status.find({ expiresAt: { $gt: new Date() } });
        res.json(estados);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const estado = await Status.create({
            ...req.body,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        res.json(estado);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/view', async (req, res) => {
    try {
        const estado = await Status.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { viewers: req.body.phone } },
            { new: true }
        );
        res.json(estado);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;