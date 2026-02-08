import mongoose from 'mongoose';

const InvestmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  // 👇 ADD THIS FIELD! This is the missing link.
  avgCost: {
    type: Number,
    required: false, // Optional because old data might not have it
  },
  pricePerShare: {
    type: Number, // This is usually the CURRENT price
    required: true,
  },
  totalValue: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

export default mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);