const TimeLog = require('../models/TimeLog');

// GET ALL
const getAll = async (req, res) => {
  try {
    const items = await TimeLog.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (e) {
    console.error("GET ERROR:", e);
    res.status(500).json({ error: 'Server error', message: e.message });
  }
};

// CREATE
const create = async (req, res) => {
  try {
    const item = await TimeLog.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({ success: true, data: item });
  } catch (e) {
    console.error("CREATE ERROR:", e);
    res.status(500).json({ error: 'Server error', message: e.message });
  }
};

// UPDATE
const update = async (req, res) => {
  try {
    const item = await TimeLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!item) return res.status(404).json({ error: 'Not found' });

    res.json({ success: true, data: item });
  } catch (e) {
    console.error("UPDATE ERROR:", e);
    res.status(500).json({ error: 'Server error', message: e.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    const item = await TimeLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!item) return res.status(404).json({ error: 'Not found' });

    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    console.error("DELETE ERROR:", e);
    res.status(500).json({ error: 'Server error', message: e.message });
  }
};

module.exports = { getAll, create, update, remove };