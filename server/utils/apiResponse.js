/**
 * Enterprise API Response Handler
 * Standardizes all API responses across the application
 * 
 * Usage: return ApiResponse.success(res, data, message)
 *        return ApiResponse.error(res, message, statusCode)
 *        return ApiResponse.paginated(res, data, pagination, message)
 */

class ApiResponse {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return response;
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString()
    };
  }

  static created(data, message = 'Created successfully') {
    return this.success(data, message, 201);
  }

  static noContent(message = 'No content') {
    return this.success(null, message, 204);
  }
}

/**
 * Async handler wrapper with centralized error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Response helpers to be used in controllers
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json(ApiResponse.success(data, message, statusCode));
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  res.status(statusCode).json(ApiResponse.error(message, statusCode, errors));
};

const sendPaginated = (res, data, pagination, message = 'Success') => {
  res.status(200).json(ApiResponse.paginated(data, pagination, message));
};

module.exports = {
  ApiResponse,
  asyncHandler,
  sendSuccess,
  sendError,
  sendPaginated
};