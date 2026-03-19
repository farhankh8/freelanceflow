const searchService = require('../services/searchService')

const search = async (req, res) => {
  try {
    const { q, type, limit } = req.query
    if (!q) return res.status(400).json({ error: 'Query is required' })
    
    const results = await searchService.globalSearch(req.user.id, q, { type, limit: parseInt(limit) || 20 })
    res.json({ success: true, ...results })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed', message: error.message })
  }
}

module.exports = { search }
