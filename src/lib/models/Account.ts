// src/lib/models/Account.ts
import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String, 
    // REMOVED 'enum'. This allows "Investment", "Crypto", etc.
    required: true, 
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Using 'delete' ensures we overwrite the old cached model if it exists
if (mongoose.models.Account) {
  delete mongoose.models.Account;
}

export default mongoose.model('Account', AccountSchema);