import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  { emoji: String, users: [String] },
  { _id: false }
);
const mediaSchema = new mongoose.Schema(
  { url: String, name: String, type: String, mimeType: String, size: Number },
  { _id: false }
);
const messageSchema = new mongoose.Schema(
  {
    chatId:    { type: String },
    groupId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    type:      { type: String, enum: ['in', 'out'], required: true },
    text:      { type: String, default: '' },
    media:     { type: mediaSchema, default: null },
    sender:    { type: String, default: '' },
    replyTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    status:    { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    readBy:    [{ type: String }],
    reactions: { type: [reactionSchema], default: [] },
    edited:    { type: Boolean, default: false },    // ← nuevo
    deleted:   { type: Boolean, default: false },    // ← nuevo
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);