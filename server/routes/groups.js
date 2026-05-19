import { Router } from 'express';
import Group from '../models/Group.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const groups = await Group.find({ 'members.phone': req.query.phone });
        res.json(groups);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const group = await Group.create(req.body);
        res.json(group);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/members', async (req, res) => {
    try {
        const { phone, nombre } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { members: { phone, nombre } } },
            { new: true }
        );
        res.json(group);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;