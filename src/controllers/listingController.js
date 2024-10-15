const Listing = require('../models/Listing');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const cleanFileName = (fileName) => {
  return fileName.replace(/\s+/g, '-').toLowerCase();
};

exports.createListing = async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);

    const { title, description, location, latitude, longitude, maxGuests, price } = req.body;
    const images = [];
    const thumbnails = [];

    // Traitement des images
    for (const file of req.files) {
      const cleanedFileName = cleanFileName(file.filename);
      const originalPath = path.join(__dirname, '../../uploads/images', file.filename);
      const resizedPath = path.join(__dirname, '../../uploads/resized', file.filename);
      const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', file.filename);

      // Assurez-vous que les dossiers existent
      await fs.mkdir(path.dirname(resizedPath), { recursive: true });
      await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

      // Redimensionner l'image
      await sharp(originalPath)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .toFile(resizedPath);

      // Créer la miniature
      await sharp(originalPath)
        .resize(200, 200, { fit: 'cover' })
        .toFile(thumbnailPath);

      images.push(`/resized/${file.filename}`);
      thumbnails.push(` /thumbnails/${file.filename}`);

      // Optionnel : supprimer l'image originale
      // await fs.unlink(originalPath);
    }

    console.log('Processed image paths:', images);
    console.log('Processed thumbnail paths:', thumbnails);

    const newListing = new Listing({
      host: req.user.id,
      title,
      description,
      location,
      latitude,
      longitude,
      maxGuests,
      price,
      images,
      thumbnails
    });

    const savedListing = await newListing.save();
    console.log('Saved listing:', savedListing);

    res.status(201).json(savedListing);
  } catch (error) {
    console.error('Error in createListing:', error);
    res.status(400).json({ message: 'Erreur lors de la récupération des listings' });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find();
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const { title, description, location, maxGuests, price } = req.body;
    const images = req.files ? req.files.map(file => file.path) : undefined;

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, 
      { title, description, location, maxGuests, price, ...(images && { images }) },
      { new: true }
    );

    res.json(updatedListing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await listing.remove();
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};