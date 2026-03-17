import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

counterSchema.statics.getNextSequenceValue = async function (sequenceName) {
    const sequenceDocument = await this.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },

        { returnDocument: 'after', upsert: true }
    );
    return sequenceDocument.seq;
};

export const Counter = mongoose.model('Counter', counterSchema);
