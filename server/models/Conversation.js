import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
    { phone: { type: String, required: true }, nombre: { type: String, default: '' } },
    { _id: false }
);

const conversationSchema = new mongoose.Schema(
    {
        chatId:       { type: String, required: true, unique: true },
        participants: [participantSchema],
        lastMessage:  { type: String, default: '' },
        lastTime:     { type: String, default: '' },
    },
    { timestamps: true }
);

export default mongoose.model('Conversation', conversationSchema);