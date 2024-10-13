const Listing = require('../models/Listing');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

exports.createListing = async (req, res) => {
  try {
    console.log('Début de la création du listing');
    console.log('Corps de la requête:', req.body);
    console.log('Fichiers reçus:', req.files);

    const { title, description, location, maxGuests, amenities, price } = req.body;

    if (!req.files || req.files.length === 0) {
      console.log('Aucune image n\'a été uploadée');
      return res.status(400).json({ message: 'Au moins une image est requise' });
    }

    const imagePaths = [];
    const thumbnailPaths = [];

    for (const file of req.files) {
      console.log(`Traitement de l'image: ${file.filename}`);
      
      const imagePath = file.path.replace(/\\/g, '/');
      const resizedPath = path.join('uploads', 'resized', file.filename);
      const thumbnailPath = path.join('uploads', 'thumbs', file.filename);

      await sharp(file.path)
        .resize(800, 600)
        .toFile(resizedPath);
      console.log(`Image redimensionnée: ${resizedPath}`);

      await sharp(file.path)
        .resize(200, 200)
        .toFile(thumbnailPath);
      console.log(`Miniature créée: ${thumbnailPath}`);

      imagePaths.push(resizedPath.replace(/\\/g, '/'));
      thumbnailPaths.push(thumbnailPath.replace(/\\/g, '/'));
    }

    console.log('Chemins des images:', imagePaths);
    console.log('Chemins des miniatures:', thumbnailPaths);

    const newListing = new Listing({
      host: req.user.id,
      title,
      description,
      location,
      maxGuests,
      amenities: amenities.split(',').map(item => item.trim()),
      price,
      images: imagePaths,
      thumbnails: thumbnailPaths
    });

    console.log('Nouveau listing à sauvegarder:', newListing);

    await newListing.save();
    res.status(201).json(newListing);
  } catch (error) {
    console.error('Erreur lors de la création du listing:', error);
    res.status(500).json({ message: 'Erreur lors de la création du listing', error: error.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find();
    console.log('Listings récupérés:', listings.map(l => ({ id: l._id, images: l.images, thumbnails: l.thumbnails })));
    res.json(listings);
  } catch (error) {
    console.error('Erreur lors de la récupération des listings:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des listings' });
  }
};

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