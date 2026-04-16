const mongoose = require('mongoose')

const COLORS = ['#6c63ff', '#ff6584', '#00d97e', '#ffb800', '#2CA5E0', '#ff4d6d', '#a78bfa', '#00c9a7']

const contactSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  company: String,
  email: String,
  phone: String,
  tag: { type: String, default: 'Client' },
  source: String,
  city: String,
  notes: String,
  starred: { type: Boolean, default: false },
  color: {
    type: String,
    default: function () {
      return COLORS[Math.floor(Math.random() * COLORS.length)]
    }
  },
  avatar: {
    type: String,
    default: function () {
      return this.name ? this.name.trim()[0].toUpperCase() : '?'
    }
  }
}, { timestamps: true })

contactSchema.pre('save', function () {
  if (this.isModified('name') && !this.avatar) {
    this.avatar = this.name.trim()[0].toUpperCase()
  }
})

module.exports = mongoose.model('Contact', contactSchema)
