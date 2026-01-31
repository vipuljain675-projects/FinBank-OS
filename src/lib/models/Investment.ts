// src/lib/models/Investment.ts
import mongoose from 'mongoose';

const InvestmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true, // e.g., AAPL
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,       // <--- FIXED: Removed strict 'enum' validation
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  pricePerShare: {
    type: Number,
    required: true,
  },
  totalValue: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

export default mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);