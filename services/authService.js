const User = require('../models/User');
const bcrypt = require('bcryptjs');

const register = async (userData) => {
  const salt = await bcrypt.genSalt(10);
  userData.password = await bcrypt.hash(userData.password, salt);
  return await User.create(userData);
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  }
  throw new Error('Incorrect email or password');
};

module.exports = { register, login };