const r = require('express').Router();
const { protect } = require('../middleware/auth');

r.use(protect);

// Temporary route to prevent 404
r.get('/', (req, res) => {
  res.json([]);
});

module.exports = r;