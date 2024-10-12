const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');


router.get('/', auth, async (req, res) => {
  console.log('Requête reçue pour le profil. User ID:', req.user.id); // Log pour le débogage
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/', auth, async (req, res) => {
  const {
    bio,
    location,
    languages,
    interests,
    isHost,
    firstName,
    lastName,
    phoneNumber,
    address,
    city,
    country,
    accommodationType,
    maxGuests,
    amenities,
    travelPreferences,
    skills,
    socialMedia
  } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mise à jour des champs
    user.bio = bio || user.bio;
    user.location = location || user.location;
    user.languages = languages || user.languages;
    user.interests = interests || user.interests;
    user.isHost = isHost !== undefined ? isHost : user.isHost;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.address = address || user.address;
    user.city = city || user.city;
    user.country = country || user.country;
    user.accommodationType = accommodationType || user.accommodationType;
    user.maxGuests = maxGuests || user.maxGuests;
    user.amenities = amenities || user.amenities;
    user.travelPreferences = travelPreferences || user.travelPreferences;
    user.skills = skills || user.skills;

    // Mise à jour des réseaux sociaux
    if (socialMedia) {
      user.socialMedia = {
        ...user.socialMedia,
        ...socialMedia
      };
    }

    // Sauvegarde des modifications
    await user.save();

    // Envoi de la réponse
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;