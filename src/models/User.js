const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  phoneNumber: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String },
  location: { type: String }, // Ajouté pour correspondre au frontend
  languages: { type: String },
  bio: { type: String },
  interests: { type: String }, // Ajouté pour correspondre au frontend
  profilePicture: { type: String, default: '' },
  isHost: { type: Boolean, default: false },
  hostings: { type: Number, default: 0 }, // Ajouté pour correspondre au frontend
  rating: { type: Number, default: 0 }, // Ajouté pour correspondre au frontend
  createdAt: { type: Date, default: Date.now },
  accommodationType: { type: String },
  maxGuests: { type: Number },
  amenities: [{ type: String }],
  travelPreferences: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },
  verifiedIdentity: {
    type: Boolean,
    default: false
  },
  reviews: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    rating: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  references: [{ // Ajouté pour correspondre au frontend
    author: String,
    content: String
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// Hash le mot de passe avant de sauvegarder
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;