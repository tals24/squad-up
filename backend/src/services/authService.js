const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verifyToken = async (user) => {
  return user.toPublicJSON();
};

exports.getCurrentUser = async (user) => {
  return user.toPublicJSON();
};

exports.updateProfile = async (userId, updateData) => {
  const { fullName, phoneNumber, department } = updateData;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { 
      fullName: fullName || user.fullName,
      phoneNumber: phoneNumber || user.phoneNumber,
      department: department || user.department
    },
    { new: true }
  );

  return updatedUser.toPublicJSON();
};

exports.login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  return {
    token,
    user: user.toPublicJSON()
  };
};

exports.register = async (userData) => {
  const { FullName, Email, Role, PhoneNumber, Department, Password } = userData;

  if (!FullName || !Email || !Role || !Password) {
    throw new Error('Full name, email, role, and password are required');
  }

  const existingUser = await User.findOne({ email: Email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  if (Password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const newUser = new User({
    fullName: FullName,
    email: Email.toLowerCase(),
    role: Role,
    phoneNumber: PhoneNumber || null,
    department: Department || null,
    password: Password
  });

  await newUser.save();

  return {
    message: `${FullName} has been added to the system successfully!`,
    user: newUser.toPublicJSON()
  };
};

