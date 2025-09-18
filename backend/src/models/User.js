const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Primary Key (equivalent to UserID formula in Airtable)
  userID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  
  // Firebase UID for authentication
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  fullName: {
    type: String,
    required: true
  },
  
  role: {
    type: String,
    required: true,
    enum: ['Coach', 'Division Manager', 'Department Manager', 'Admin']
  },
  
  profileImage: {
    type: String,
    default: null
  },
  
  // Additional fields for role-based access
  department: {
    type: String,
    default: null
  },
  
  phoneNumber: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient queries
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);


