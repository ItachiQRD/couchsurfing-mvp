const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

// Créer une nouvelle réservation
router.post('/', auth, async (req, res) => {
  try {
    const { listingId, startDate, endDate } = req.body;
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({ msg: 'Hébergement non trouvé' });
    }

    const newBooking = new Booking({
      listing: listingId,
      guest: req.user.id,
      host: listing.host,
      startDate,
      endDate
    });

    const booking = await newBooking.save();
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

// Obtenir les réservations de l'utilisateur (en tant que voyageur)
router.get('/guest', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id })
      .populate('listing', 'title location')
      .populate('host', 'username');
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

// Obtenir les réservations de l'utilisateur (en tant qu'hôte)
router.get('/host', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user.id })
      .populate('listing', 'title location')
      .populate('guest', 'username');
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

// Mettre à jour le statut d'une réservation (pour l'hôte)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Réservation non trouvée' });
    }

    if (booking.host.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Non autorisé' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;