const Listing = require('../models/Listing');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
exports.createListing = async (req, res) => {
  try {
    const { title, description, location, maxGuests, price } = req.body;
    const images = req.files.map(file => file.path);

    const newListing = new Listing({
      host: req.user.id,
      title,
      description,
      location,
      maxGuests,
      price,
      images
    });

    await newListing.save();
    res.status(201).json(newListing);
  } catch (error) {
    res.status(400).json({ message: error.message });
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