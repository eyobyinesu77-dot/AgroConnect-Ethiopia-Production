const Message = require('../models/Message');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');

// Who can message whom. Admin can message (and be messaged by) every role,
// unchanged. Farmer <-> Buyer is role-level (any farmer, any buyer),
// unchanged — there's no per-user relationship gating that pair. Farmer
// <-> Extension Worker is now assignment-gated: a farmer may only reach
// the specific extension worker in their own assignedExtensionWorker
// field (see User.js), and an extension worker may only reach farmers
// whose assignedExtensionWorker points back at them. Buyer <-> Extension
// and any same-role pairing remain blocked, unchanged.
const canUsersMessage = (userA, userB) => {
  if (userA.role === 'admin' || userB.role === 'admin') return true;

  if ((userA.role === 'farmer' && userB.role === 'buyer') || (userA.role === 'buyer' && userB.role === 'farmer')) {
    return true;
  }

  const farmer = userA.role === 'farmer' ? userA : (userB.role === 'farmer' ? userB : null);
  const extensionWorker = userA.role === 'extension' ? userA : (userB.role === 'extension' ? userB : null);
  if (farmer && extensionWorker) {
    return Boolean(farmer.assignedExtensionWorker) && String(farmer.assignedExtensionWorker) === String(extensionWorker._id);
  }

  return false; // buyer-extension, same-role pairs, etc.
};

// GET /api/messages/contacts — the people the logged-in user can message.
// Farmer and Extension Worker cases are now assignment-scoped rather than
// "every user of an allowed role" — see canUsersMessage above for why.
const getContacts = async (req, res) => {
  try {
    const fields = 'fullName phone region role';
    let contacts;

    if (req.user.role === 'admin') {
      contacts = await User.find({ role: { $ne: 'admin' } }).select(fields);
    } else if (req.user.role === 'farmer') {
      const [admins, buyers] = await Promise.all([
        User.find({ role: 'admin' }).select(fields),
        User.find({ role: 'buyer' }).select(fields),
      ]);
      let assignedWorker = [];
      if (req.user.assignedExtensionWorker) {
        const worker = await User.findOne({ _id: req.user.assignedExtensionWorker, role: 'extension' }).select(fields);
        if (worker) assignedWorker = [worker];
      }
      contacts = [...admins, ...buyers, ...assignedWorker];
    } else if (req.user.role === 'extension') {
      const [admins, assignedFarmers] = await Promise.all([
        User.find({ role: 'admin' }).select(fields),
        User.find({ role: 'farmer', assignedExtensionWorker: req.user._id }).select(fields),
      ]);
      contacts = [...admins, ...assignedFarmers];
    } else if (req.user.role === 'buyer') {
      const [admins, farmers] = await Promise.all([
        User.find({ role: 'admin' }).select(fields),
        User.find({ role: 'farmer' }).select(fields),
      ]);
      contacts = [...admins, ...farmers];
    } else {
      contacts = [];
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages — send a message to another user
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content?.trim()) {
      return res.status(400).json({ message: 'recipientId and content are required.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }
    if (!canUsersMessage(req.user, recipient)) {
      return res.status(403).json({ message: 'You are not allowed to message this user.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim(),
    });

    notifyUser(recipientId, `New message from ${req.user.fullName}`);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/:userId — the conversation thread with a specific user.
// Authorization is checked fresh on every request using the CURRENT
// assignment, not just whether messages happen to already exist — this is
// what makes reassignment actually take effect: if a farmer is moved from
// Extension Worker A to B, this endpoint immediately stops returning A's
// old thread to the farmer (or A), without deleting anything from MongoDB.
const getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!canUsersMessage(req.user, otherUser)) {
      // Deliberately generic — doesn't confirm or deny whether a
      // conversation exists between the two users.
      return res.status(403).json({ message: 'You are not authorized to view this conversation.' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    // Mark any messages sent TO the logged-in user in this thread as read.
    await Message.updateMany(
      { sender: otherUserId, recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/unread-counts — how many unread messages the logged-in
// user has from each sender, so contact lists can show an unread badge.
// The underlying isRead tracking already existed (see getConversation's
// auto-mark-as-read below) — this just exposes it to the contact list,
// which had no way to surface it before.
const getUnreadCounts = async (req, res) => {
  try {
    const counts = await Message.aggregate([
      { $match: { recipient: req.user._id, isRead: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } },
    ]);
    const result = {};
    counts.forEach((c) => { result[c._id] = c.count; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getContacts, sendMessage, getConversation, getUnreadCounts };
