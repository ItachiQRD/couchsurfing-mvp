const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const auth = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validate');

// Route protégée (exemple)
router.get('/route-protegee', auth, (req, res) => {
  res.json({ message: "Accès autorisé à la route protégée" });
});

// Vérification de la disponibilité du nom d'utilisateur
router.get('/check-username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.json({ available: !user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route d'inscription
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      dateOfBirth, 
      phoneNumber, 
      address, 
      city, 
      country, 
      languages, 
      bio,
      isHost
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Utilisateur déjà existant' });
    }
  
    // Créer un nouvel utilisateur 
    user = new User({ 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      dateOfBirth, 
      phoneNumber, 
      address, 
      city, 
      country, 
      languages, 
      bio,
      isHost,
      isVerified: false // Initialisation de isVerified à false
    });
    await user.save();

    // Créer un token de vérification
    const verificationToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Envoyer l'email de vérification
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({ message: 'Utilisateur créé. Veuillez vérifier votre email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de vérification d'email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Lien de vérification invalide' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Lien de vérification invalide ou expiré' });
  }
});

// Route de connexion
router.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Identifiants invalides' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Identifiants invalides' });
    }

    // Vérifier si l'utilisateur est vérifié
    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Veuillez vérifier votre email avant de vous connecter' });
    }

    // Créer et signer le token JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});


// Route pour demander une réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Aucun compte associé à cet email' });
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'Un email de réinitialisation a été envoyé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour vérifier le token de réinitialisation
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});



// Route pour réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Lien de réinitialisation invalide' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Lien de réinitialisation invalide ou expiré' });
  }
});

module.exports = router;