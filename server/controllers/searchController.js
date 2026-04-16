const searchService = require('../services/searchService');
const asyncHandler = require('../middleware/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const { q, type, limit } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  const results = await searchService.globalSearch(req.user.id, q, { type, limit: parseInt(limit) || 20 });
  res.json({ success: true, ...results });
});

module.exports = { search };
