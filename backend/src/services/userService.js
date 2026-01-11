const User = require('../models/User');

exports.getAllUsers = async () => {
  const users = await User.find()
    .select('-password')
    .sort({ fullName: 1 });

  return users;
};

exports.getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

exports.createUser = async (data) => {
  const { email, fullName, role, department, phoneNumber } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const user = new User({
    email,
    fullName,
    role: role || 'Coach',
    department,
    phoneNumber
  });

  await user.save();

  return {
    id: user._id,
    userID: user.userID,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    department: user.department,
    phoneNumber: user.phoneNumber
  };
};

exports.updateUser = async (id, updateData) => {
  const { fullName, role, department, phoneNumber } = updateData;

  const user = await User.findByIdAndUpdate(
    id,
    { fullName, role, department, phoneNumber },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

