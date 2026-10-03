const Support = require('../models/Support');
const { notifyAdmins } = require('../utils/notify');

// POST /api/support — anyone (guest or logged-in) submits a support inquiry.
// This always creates a Support ticket visible only to Admin — there is no
// code path here that creates a private Farmer/Buyer message (see
// messageController.js for that separate system).
const createTicket = async (req, res) => {
  try {
    const { subject, phone, category, language, message, guestName, guestEmail } = req.body;

    if (!subject?.trim() || !category || !message?.trim()) {
      return res.status(400).json({ message: 'subject, category, and message are required.' });
    }
    if (!['Technical Issue', 'Payment Issue', 'General Inquiry'].includes(category)) {
      return res.status(400).json({ message: 'Invalid support category.' });
    }
    if (!req.user && !guestEmail?.trim()) {
      return res.status(400).json({ message: 'guestEmail is required when not logged in.' });
    }

    const ticket = await Support.create({
      user: req.user?._id,
      guestEmail: req.user ? undefined : guestEmail.trim(),
      phone: phone?.trim() || undefined,
      subject: subject.trim(),
      category,
      language: language || 'English',
      message: message.trim(),
    });

    notifyAdmins(`New support ticket (${category}) from ${req.user?.fullName || guestEmail || 'Guest'}`);

    res.status(201).json({ message: 'Your inquiry has been submitted. We will get back to you soon.', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/support/mine — the logged-in user's own tickets
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Support.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/support — admin: every support ticket
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Support.find()
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/support/:id/status — admin updates a ticket's status
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Read', 'Replied', 'Archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const ticket = await Support.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/support/:id — admin deletes a ticket (e.g. spam, or a
// resolved/archived inquiry no longer worth keeping)
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Support.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    res.json({ message: 'Ticket deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/support/:id/reply — admin replies to a public support ticket
// Reply is sent via email/SMS to the guest or user
const replyToTicket = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required.' });
    }

    const ticket = await Support.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Update ticket with admin reply
    ticket.adminReply = {
      content: content.trim(),
      repliedBy: req.user._id,
      repliedAt: new Date(),
    };
    ticket.status = 'Replied';
    await ticket.save();

    // Send email to guest or registered user
    const contactEmail = ticket.guestEmail || ticket.user?.email;
    const contactName = ticket.guestName || ticket.user?.fullName || 'User';

    if (contactEmail) {
      // Send email with reply
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: contactEmail,
        subject: `Reply to your inquiry: ${ticket.subject}`,
        html: `
          <h2>Hello ${contactName},</h2>
          <p>We have replied to your inquiry:</p>
          <h3>${ticket.subject}</h3>
          <p><strong>Your Message:</strong></p>
          <p>${ticket.message}</p>
          <hr>
          <p><strong>Our Reply:</strong></p>
          <p>${ticket.adminReply.content}</p>
          <hr>
          <p>Thank you for contacting AgroConnect Ethiopia!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({
      message: 'Reply sent to user via email.',
      ticket,
    });
  } catch (error) {
    console.error('Support reply error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTicket, getMyTickets, getAllTickets, updateTicketStatus, deleteTicket, replyToTicket };
