import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    qty: { type: Number, required: true, min: 1 }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
    status: { type: String, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true }, 
    userId: { // Changed from customerId to userId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    statusHistory: [statusHistorySchema], 
    tracking: {                           
        courierName: { type: String },    
        trackingNumber: { type: String }, 
        trackingUrl: { type: String }     
    },
    paymentTerms: {
        type: String,
        enum: ['DUE_ON_RECEIPT', 'NET_15', 'NET_30'],
        default: 'DUE_ON_RECEIPT'
    },
    paymentMethod: {
        type: String,
        enum: ['RAZORPAY', 'WALLET', 'BANK_TRANSFER'],
        default: 'RAZORPAY'
    },
    totalAmount: { type: Number, required: true },
    items: [orderItemSnapshotSchema],
    orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for filtering orders by status and user
orderSchema.index({ userId: 1, status: 1 });

// Pre-save hook: Automatically log the first status when an order is created
orderSchema.pre('save', function() {
    if (this.isNew) {
        this.statusHistory.push({ status: this.status, comment: 'Order placed successfully' });
    }
    if (!this.isNew && this.isModified('status')) {
        this.statusHistory.push({ status: this.status, comment: `Order marked as ${this.status}` });
    }
    // Notice: We completely removed next()
});

export const Order = mongoose.model('Order', orderSchema);
