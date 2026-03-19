const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  plan:         { type: String, enum: ['free', 'pro'], default: 'free' },
  phone:        { type: String, default: '' },
  refreshToken: { type: String, select: false },
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    gstin: { type: String, default: '' },
    businessName: { type: String, default: '' },
    businessAddress: { type: String, default: '' },
    upiId: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

userSchema.index({ email: 1 })
userSchema.index({ plan: 1 })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

userSchema.methods.comparePassword = async function(p) {
  return bcrypt.compare(p, this.password)
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  return obj
}

module.exports = mongoose.model('User', userSchema)