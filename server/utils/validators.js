/**
 * Enterprise Input Validation Schemas (Zod)
 * Validates all API inputs before reaching controllers
 */

const { z } = require('zod');

/**
 * Password validation schema
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)');

/**
 * User registration validation
 */
const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase(),
  password: passwordSchema
});

/**
 * User login validation
 */
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255),
  password: z.string()
    .min(1, 'Password is required')
});

/**
 * Profile update validation
 */
const updateProfileSchema = z.object({
  name: z.string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/)
    .optional(),
  phone: z.string()
    .max(20)
    .optional(),
  settings: z.object({
    currency: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
    gstin: z.string().max(20).optional(),
    businessName: z.string().max(100).optional(),
    businessAddress: z.string().max(500).optional(),
    upiId: z.string().max(50).optional(),
    bankName: z.string().max(100).optional(),
    accountNumber: z.string().max(20).optional(),
    ifsc: z.string().max(20).optional(),
    theme: z.enum(['dark', 'light', 'system']).optional()
  }).optional()
});

/**
 * Client validation schemas
 */
const clientSchema = z.object({
  name: z.string()
    .min(2, 'Client name is required')
    .max(100),
  email: z.string()
    .email()
    .max(255)
    .optional()
    .or(z.literal('')),
  company: z.string()
    .max(100)
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .max(20)
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(500)
    .optional()
    .or(z.literal('')),
  gstin: z.string()
    .max(20)
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional()
});

const clientUpdateSchema = clientSchema.partial();

/**
 * Project validation schemas
 */
const projectSchema = z.object({
  title: z.string()
    .min(2, 'Project title is required')
    .max(200),
  client: z.string()
    .optional(),
  description: z.string()
    .max(2000)
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'completed', 'on-hold', 'cancelled']).optional(),
  budget: z.number()
    .min(0)
    .optional(),
  startDate: z.string()
    .optional(),
  endDate: z.string()
    .optional()
});

/**
 * Invoice validation schemas
 */
const invoiceSchema = z.object({
  clientId: z.string()
    .min(1, 'Client is required'),
  projectId: z.string()
    .optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    hours: z.number().min(0),
    rate: z.number().min(0),
    amount: z.number().min(0)
  })).min(1, 'At least one item is required'),
  taxRate: z.number()
    .min(0)
    .max(100)
    .optional(),
  dueDate: z.string()
    .optional(),
  notes: z.string()
    .max(1000)
    .optional()
    .or(z.literal('')),
  isGstInvoice: z.boolean().optional(),
  clientGstin: z.string().max(20).optional(),
  placeOfSupply: z.string().max(50).optional(),
  upiTransactionId: z.string().max(50).optional(),
  paymentMethod: z.enum(['upi', 'bank-transfer', 'cash', 'card']).optional()
});

/**
 * Contract validation schemas
 */
const contractSchema = z.object({
  title: z.string()
    .min(2, 'Contract title is required')
    .max(200),
  client: z.string()
    .min(2, 'Client name is required')
    .max(100),
  company: z.string()
    .max(100)
    .optional()
    .or(z.literal('')),
  contractType: z.enum([
    'Fixed Price', 'Hourly Rate', 'Retainer', 
    'Milestone-Based', 'Revenue Share', 'Subscription'
  ]).optional(),
  value: z.number()
    .min(0)
    .optional(),
  startDate: z.string()
    .optional(),
  endDate: z.string()
    .optional(),
  paymentTerms: z.string()
    .max(200)
    .optional(),
  scope: z.string()
    .max(5000)
    .optional(),
  deliverables: z.string()
    .max(5000)
    .optional(),
  revisions: z.number()
    .min(0)
    .max(100)
    .optional(),
  status: z.enum([
    'draft', 'sent', 'signed', 'active', 
    'completed', 'cancelled', 'expired'
  ]).optional(),
  notes: z.string()
    .max(2000)
    .optional()
});

/**
 * Expense validation schemas
 */
const expenseSchema = z.object({
  description: z.string()
    .min(2, 'Description is required')
    .max(200),
  category: z.string()
    .min(2, 'Category is required')
    .max(50),
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0'),
  date: z.string()
    .optional(),
  client: z.string()
    .optional(),
  project: z.string()
    .optional(),
  receipt: z.string()
    .max(500)
    .optional(),
  isBusinessExpense: z.boolean().optional()
});

/**
 * Time log validation schemas
 */
const timeLogSchema = z.object({
  description: z.string()
    .min(2, 'Description is required')
    .max(200),
  project: z.string()
    .optional(),
  client: z.string()
    .optional(),
  duration: z.number()
    .min(0.25, 'Duration must be at least 15 minutes')
    .max(24, 'Duration cannot exceed 24 hours'),
  date: z.string()
    .optional(),
  billable: z.boolean().optional(),
  rate: z.number()
    .min(0)
    .optional()
});

/**
 * Lead validation schemas
 */
const leadSchema = z.object({
  name: z.string()
    .min(2, 'Name is required')
    .max(100),
  email: z.string()
    .email()
    .max(255)
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .max(20)
    .optional(),
  company: z.string()
    .max(100)
    .optional(),
  source: z.string()
    .max(50)
    .optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  value: z.number()
    .min(0)
    .optional(),
  notes: z.string()
    .max(2000)
    .optional()
});

/**
 * Payment validation schemas
 */
const paymentSchema = z.object({
  invoice: z.string()
    .min(1, 'Invoice is required'),
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0'),
  date: z.string()
    .optional(),
  method: z.enum(['upi', 'bank-transfer', 'cash', 'card', 'other']).optional(),
  transactionId: z.string()
    .max(100)
    .optional(),
  notes: z.string()
    .max(500)
    .optional()
});

/**
 * Validate middleware factory
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'query' ? req.query : req.body;
      const validated = schema.parse(data);
      
      // Update request with validated (and sanitized) data
      if (source === 'body') {
        req.body = validated;
      } else {
        req.query = validated;
      }
      
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
          timestamp: new Date().toISOString()
        });
      }
      
      next(error);
    }
  };
};

/**
 * Optional validation (for partial updates)
 */
const validateOptional = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.partial().parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
          timestamp: new Date().toISOString()
        });
      }
      
      next(error);
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  clientSchema,
  clientUpdateSchema,
  projectSchema,
  invoiceSchema,
  contractSchema,
  expenseSchema,
  timeLogSchema,
  leadSchema,
  paymentSchema,
  validate,
  validateOptional,
  passwordSchema
};