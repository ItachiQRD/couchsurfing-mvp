const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware pour vérifier si l'utilisateur est un hôte
const isHost = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    if (!user.isHost) {
      return res.status(403).json({ msg: 'Accès refusé. Seuls les hôtes peuvent créer des annonces.' });
    }
    next();
  } catch (error) {
    console.error('Erreur dans le middleware isHost:', error);
    res.status(500).json({ msg: 'Erreur serveur', error: error.message });
  }
};

// Création d'hébergement
router.post('/', auth, isHost, listingController.createListing);

// Obtenir tous les hébergements
router.get('/', listingController.getAllListings);

// Obtenir un hébergement spécifique
router.get('/:id', listingController.getListing);

// Rechercher des hébergements
router.get('/search', listingController.searchListings);

module.exports = router;