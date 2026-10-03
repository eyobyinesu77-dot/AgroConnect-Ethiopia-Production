const Notification = require('../models/Notification');
const User = require('../models/User');

// Small helper so other controllers can fire a notification in one line
// without each of them needing to import the Notification model directly.
const notifyUser = async (userId, message) => {
  try {
    await Notification.create({ user: userId, message });
  } catch (error) {
    // Notifications are a side-effect, not core to the action that triggered
    // them — never let a notification failure break order/loan/etc. creation.
    console.error('Failed to create notification:', error.message);
  }
};

const notifyAdmins = async (message) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Notification.insertMany(admins.map((admin) => ({ user: admin._id, message })));
  } catch (error) {
    console.error('Failed to notify admins:', error.message);
  }
};

module.exports = { notifyUser, notifyAdmins };
