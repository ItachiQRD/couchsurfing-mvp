const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Bloquer un utilisateur
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userToBlock = await User.findById(req.params.userId);

    if (!userToBlock) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    if (user.blockedUsers.includes(req.params.userId)) {
      return res.status(400).json({ msg: 'Utilisateur déjà bloqué' });
    }

    user.blockedUsers.push(req.params.userId);
    await user.save();

    res.json({ msg: 'Utilisateur bloqué avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

// Débloquer un utilisateur
router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== req.params.userId
    );
    await user.save();

    res.json({ msg: 'Utilisateur débloqué avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

// Vérifier le statut de blocage d'un utilisateur
router.get('/block-status/:userId', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const isBlocked = user.blockedUsers.includes(req.params.userId);
      res.json({ isBlocked });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur serveur');
    }
  });

  router.get('/permissions', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'Utilisateur non trouvé' });
      }
      res.json({
        isHost: user.isHost,
        // Ajoutez d'autres permissions si nécessaire
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({ msg: 'Erreur serveur' });
    }
  });

module.exports = router;