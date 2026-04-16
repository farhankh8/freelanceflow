/**
 * Pagination Utility for Enterprise APIs
 * Provides standardized pagination, filtering, and sorting
 */

const { sendError, sendPaginated } = require('./apiResponse')
const { logger } = require('../config/logger')

/**
 * Build pagination middleware for any model
 */
const paginate = (model, options = {}) => {
  const { 
    defaultLimit = 20,
    maxLimit = 100,
    defaultSort = '-createdAt',
    searchFields = ['name', 'email', 'title'],
    filterableFields = ['status', 'type', 'category'],
    searchable = true
  } = options

  return async (req, res, next) => {
    try {
      // Parse pagination params
      const page = Math.max(1, parseInt(req.query.page) || 1)
      const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit))
      const skip = (page - 1) * limit

      // Build filter
      const filter = { user: req.user.id }

      // Apply status filter
      if (req.query.status) {
        filter.status = req.query.status
      }

      // Apply type/category filter
      for (const field of filterableFields) {
        if (req.query[field]) {
          filter[field] = req.query[field]
        }
      }

      // Apply client/project filter
      if (req.query.clientId || req.query.client) {
        filter.client = req.query.clientId || req.query.client
      }
      if (req.query.projectId || req.query.project) {
        filter.project = req.query.projectId || req.query.project
      }

      // Apply date range filter
      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {}
        if (req.query.startDate) {
          filter.createdAt.$gte = new Date(req.query.startDate)
        }
        if (req.query.endDate) {
          filter.createdAt.$lte = new Date(req.query.endDate)
        }
      }

      // Search filter (with regex injection protection)
      if (req.query.search && searchable && searchFields.length > 0) {
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const safeSearch = escapeRegex(String(req.query.search));
        filter.$or = searchFields.map(field => ({
          [field]: { $regex: safeSearch, $options: 'i' }
        }));
      }

      // Build sort
      let sort = {}
      const sortBy = req.query.sortBy || defaultSort.replace('-', '')
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1
      sort[sortBy] = req.query.sortBy 
        ? sortOrder 
        : (defaultSort.startsWith('-') ? -1 : 1)

      // Execute queries in parallel
      const [data, total] = await Promise.all([
        model.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        model.countDocuments(filter)
      ])

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit)
      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }

      // Store for next middleware
      res.paginated = { data, pagination }

      next()
    } catch (error) {
      logger.error({ err: error, query: req.query }, 'Pagination error')
      next(error)
    }
  }
}

/**
 * Send paginated response
 */
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  })
}

/**
 * Build filter from query params (for advanced filtering)
 */
const buildFilter = (req, allowedFields = []) => {
  const filter = { user: req.user?.id }

  for (const field of allowedFields) {
    if (req.query[field] !== undefined) {
      filter[field] = req.query[field]
    }
  }

  return filter
}

/**
 * Parse sort params
 */
const parseSort = (options = {}, defaultSort = '-createdAt') => {
  const sortBy = options.sortBy || defaultSort.replace('-', '')
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1
  return { [sortBy]: sortOrder }
}

module.exports = {
  paginate,
  sendPaginatedResponse,
  buildFilter,
  parseSort
}