import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
    {
        phone:     { type: String, required: true },
        nombre:    { type: String, default: '' },
        content:   { type: String, required: true },
        type:      { type: String, enum: ['text', 'image', 'video'], default: 'text' },
        color:     { type: String, default: '#1e1d1a' },
        viewers:   [{ type: String }],
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

export default mongoose.model('Status', statusSchema);