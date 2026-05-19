import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
    { phone: { type: String, required: true }, nombre: { type: String, default: '' }, admin: { type: Boolean, default: false } },
    { _id: false }
);

const groupSchema = new mongoose.Schema(
    {
        name:        { type: String, required: true },
        description: { type: String, default: '' },
        members:     [memberSchema],
        createdBy:   { type: String },
        initials:    { type: String, default: 'G' },
    },
    { timestamps: true }
);

export default mongoose.model('Group', groupSchema);