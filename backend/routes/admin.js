// admin.js: Express router for admin-related routes
// Rewritten from Mongoose to Sequelize (PostgreSQL)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const Admin = require('../models/Admin');
const Child = require('../models/Child');
const Note = require('../models/Note');
const EmotionHistory = require('../models/EmotionHistory');
const GameReport = require('../models/GameReport');

// Middleware to authenticate admin users
const authenticateAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.adminId);
    if (!admin || !admin.active)
      return res.status(401).json({ message: 'Unauthorized' });
    req.admin = admin;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Route: Verify admin token
router.get('/verify-token', authenticateAdmin, async (req, res) => {
  try {
    res.json({ message: 'Token is valid', adminId: req.admin._id });
  } catch (err) {
    console.error('❌ Error verifying token:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin || !admin.active)
      return res
        .status(400)
        .json({ message: 'Invalid email or account disabled' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Login successful', token, adminId: admin._id });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Register a new child
router.post('/register-child', authenticateAdmin, async (req, res) => {
  const { childName, phone, userId, password } = req.body;
  if (!childName || !phone || !userId || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingChild = await Child.findOne({
      where: { [Op.or]: [{ phone }, { userId }] },
    });
    if (existingChild) {
      return res
        .status(400)
        .json({ message: 'Child with this phone or user ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newChild = await Child.create({
      childName,
      phone,
      userId,
      password: hashedPassword,
      parentId: req.admin._id,
    });

    req.app
      .get('io')
      .emit('newChild', { parentId: req.admin._id, child: newChild });
    res.json({ message: 'Child registered successfully', child: newChild });
  } catch (err) {
    console.error('❌ Register child error:', err);
    res.status(500).json({ message: 'Server error registering child' });
  }
});

// Route: Get all children for the logged-in admin
router.get('/children', authenticateAdmin, async (req, res) => {
  try {
    const children = await Child.findAll({
      where: { parentId: req.admin._id },
      order: [['created_at', 'DESC']],
    });
    res.json(children);
  } catch (err) {
    console.error('❌ Error fetching children:', err);
    res.status(500).json({ message: 'Error fetching children' });
  }
});

// Route: Edit child information
router.put('/children/:childId/edit', authenticateAdmin, async (req, res) => {
  const { childId } = req.params;
  const { childName, phone, userId } = req.body;

  try {
    const existingChild = await Child.findOne({
      where: {
        [Op.or]: [{ phone }, { userId }],
        _id: { [Op.ne]: childId },
      },
    });
    if (existingChild) {
      return res
        .status(400)
        .json({ message: 'Phone or user ID already in use by another child' });
    }

    const child = await Child.findOne({
      where: { _id: childId, parentId: req.admin._id },
    });
    if (!child)
      return res.status(404).json({ message: 'Child not found or unauthorized' });

    await child.update({ childName, phone, userId });

    req.app
      .get('io')
      .emit('childUpdated', { parentId: req.admin._id, child });
    res.json({ message: 'Child updated successfully', child });
  } catch (err) {
    console.error('❌ Error updating child:', err);
    res.status(500).json({ message: 'Error updating child' });
  }
});

// Route: Delete a child
router.delete(
  '/children/:childId/delete',
  authenticateAdmin,
  async (req, res) => {
    const { childId } = req.params;

    try {
      const child = await Child.findOne({
        where: { _id: childId, parentId: req.admin._id },
      });
      if (!child)
        return res
          .status(404)
          .json({ message: 'Child not found or unauthorized' });

      // Delete related records first (cascade)
      await EmotionHistory.destroy({ where: { childId: child._id } });
      await GameReport.destroy({ where: { childId: child._id } });
      await Note.destroy({ where: { childId: child._id } });

      // Then delete the child
      await child.destroy();

      req.app
        .get('io')
        .emit('childDeleted', { parentId: req.admin._id, childId });
      res.json({ message: 'Child deleted successfully' });
    } catch (err) {
      console.error('❌ Error deleting child:', err);
      res.status(500).json({ message: 'Error deleting child' });
    }
  }
);

// Route: Reset child password
router.post(
  '/children/:childId/reset-password',
  authenticateAdmin,
  async (req, res) => {
    const { childId } = req.params;
    const temporaryPassword = crypto.randomBytes(4).toString('hex');

    try {
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const child = await Child.findOne({
        where: { _id: childId, parentId: req.admin._id },
      });
      if (!child)
        return res
          .status(404)
          .json({ message: 'Child not found or unauthorized' });

      await child.update({ password: hashedPassword });

      res.json({ message: 'Password reset successfully', temporaryPassword });
    } catch (err) {
      console.error('❌ Error resetting child password:', err);
      res.status(500).json({ message: 'Error resetting password' });
    }
  }
);

// Route: Activate or deactivate a child account
router.patch(
  '/children/:childId/status',
  authenticateAdmin,
  async (req, res) => {
    const { childId } = req.params;
    const { isActive } = req.body;

    try {
      const child = await Child.findOne({
        where: { _id: childId, parentId: req.admin._id },
      });
      if (!child)
        return res
          .status(404)
          .json({ message: 'Child not found or unauthorized' });

      await child.update({ isActive });

      req.app
        .get('io')
        .emit('childStatusUpdated', { parentId: req.admin._id, child });
      res.json({
        message: `Child status updated to ${isActive ? 'Active' : 'Inactive'}`,
        child,
      });
    } catch (err) {
      console.error('❌ Error updating child status:', err);
      res.status(500).json({ message: 'Error updating child status' });
    }
  }
);

// ---
// --- ADMIN NOTES ROUTES
// ---

// 1. GET: Fetch all notes for a specific child
router.get('/child/:childId/notes', authenticateAdmin, async (req, res) => {
  try {
    // Verify the child belongs to this admin
    const child = await Child.findOne({
      where: { _id: req.params.childId, parentId: req.admin._id },
    });

    if (!child) {
      return res.status(404).json({ message: 'Child not found for this admin.' });
    }

    const notes = await Note.findAll({
      where: { childId: req.params.childId },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error while fetching notes.' });
  }
});

// 2. POST: Save a new note for a specific child
router.post('/child/:childId/notes', authenticateAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Note text is required.' });
    }

    // Verify this child belongs to this admin before adding a note
    const child = await Child.findOne({
      where: { _id: req.params.childId, parentId: req.admin._id },
    });
    if (!child) {
      return res.status(404).json({ message: 'Child not found for this admin.' });
    }

    const newNote = await Note.create({
      text,
      childId: req.params.childId,
      adminId: req.admin._id,
      adminName: req.admin.name || 'Admin',
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ message: 'Server error while saving note.' });
  }
});

module.exports = router;