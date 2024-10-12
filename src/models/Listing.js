const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  location: {
    type: String,
    required: true
  },
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  amenities: [{
    type: String,
    enum: ['Wi-Fi', 'Cuisine', 'Parking', 'Climatisation', 'Chauffage', 'Lave-linge', 'Sèche-linge', 'Télévision', 'Fer à repasser', 'Espace de travail']
  }],
  availability: [{
    from: {
      type: Date,
      required: true
    },
    to: {
      type: Date,
      required: true
    }
  }],
  images: [{ 
    type: String 
  }] ,
  thumbnails: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ajout d'un index pour améliorer les performances de recherche
listingSchema.index({ location: 'text', title: 'text', description: 'text' });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;