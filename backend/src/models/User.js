const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Primary Key (equivalent to UserID formula in Airtable)
  userID: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
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
  },
  
  // Password for authentication (hashed)
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public user data (exclude password)
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    userID: this.userID,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    profileImage: this.profileImage,
    department: this.department,
    phoneNumber: this.phoneNumber,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);


