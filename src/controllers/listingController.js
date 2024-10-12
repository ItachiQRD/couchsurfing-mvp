const Listing = require('../models/Listing');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;


// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

exports.createListing = [
  upload.array('images', 5),
  async (req, res) => {
    try {
      console.log('Données reçues:', req.body);
      console.log('Fichiers reçus:', req.files);

      const { title, description, location, maxGuests, amenities, availability, price } = req.body;

      // Vérification et traitement des amenities
      let filteredAmenities = [];
      if (amenities && Array.isArray(amenities)) {
        const validAmenities = ['Wi-Fi', 'Cuisine', 'Parking', 'Climatisation', 'Chauffage', 'Lave-linge', 'Sèche-linge', 'Télévision', 'Fer à repasser', 'Espace de travail'];
        filteredAmenities = amenities.filter(amenity => validAmenities.includes(amenity));
      } else if (typeof amenities === 'string') {
        filteredAmenities = amenities.split(',').map(item => item.trim());
      }

      const imagePaths = [];
      const thumbnailPaths = [];

      // Traitement des images
      for (const file of req.files) {
        const filename = file.filename;
        const filepath = file.path;
        const resizedFilename = 'resized-' + filename;
        const thumbnailFilename = 'thumb-' + filename;

        try {
          // Redimensionner l'image principale
          await sharp(filepath)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .toFile(path.join(__dirname, '..', '..', 'uploads', resizedFilename));

          // Créer une miniature
          await sharp(filepath)
            .resize(300, 200, { fit: 'cover' })
            .toFile(path.join(__dirname, '..', '..', 'uploads', thumbnailFilename));

          // Supprimer l'original
          await fs.unlink(filepath);

          imagePaths.push(resizedFilename);
          thumbnailPaths.push(thumbnailFilename);
        } catch (error) {
          console.error('Erreur lors du traitement de l\'image:', error);
          // Continuer avec les autres images en cas d'erreur
        }
      }

      const newListing = new Listing({
        host: req.user.id,
        title,
        description,
        location,
        maxGuests: parseInt(maxGuests),
        amenities: filteredAmenities,
        availability: JSON.parse(availability),
        price: parseFloat(price),
        images: imagePaths,
        thumbnails: thumbnailPaths
      });

      console.log('Nouvel objet Listing:', newListing);

      const listing = await newListing.save();
      res.status(201).json(listing);
    } catch (error) {
      console.error('Erreur lors de la création de l\'hébergement:', error);
      res.status(500).json({
        message: "Erreur lors de la création de l'hébergement",
        error: error.message
      });
    }
  }
];
  
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate('host', 'username');
    res.status(200).json(listings);
  } catch (error) {
    res.status(400).json({
      message: 'Erreur lors de la récupération des hébergements',
      error: error.message
    });
  }
};

exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('host', 'username');
    if (!listing) {
      return res.status(404).json({ message: 'Hébergement non trouvé' });
    }
    res.status(200).json(listing);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération de l'hébergement",
      error: error.message
    });
  }
};

exports.searchListings = async (req, res) => {
  try {
    const { location, guests, from, to } = req.query;
    const query = {};
    if (location) query.location = new RegExp(location, 'i');
    if (guests) query.maxGuests = { $gte: parseInt(guests) };
    if (from && to) {
      query.availability = {
        $elemMatch: {
          from: { $lte: new Date(to) },
          to: { $gte: new Date(from) }
        }
      };
    }
    const listings = await Listing.find(query).populate('host', 'username');
    res.status(200).json(listings);
  } catch (error) {
    res.status(400).json({
      message: 'Erreur lors de la recherche des hébergements',
      error: error.message
    });
  }
};