const Notification = require('../models/Notification');

const sendNotification = async (userId, message) => {
  return await Notification.create({ user: userId, message });
};

module.exports = { sendNotification };