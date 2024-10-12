const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Assurez-vous que ce dossier existe
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: File upload only supports the following filetypes - " + filetypes);
  },
  limits: { fileSize: 1000000 }, // Limite à 1MB
});

// Envoyer un message
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ msg: 'ID de destinataire invalide ou manquant' });
    }

    // Vérifier si l'expéditeur est bloqué par le destinataire
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: 'Destinataire non trouvé' });
    }
    if (recipient.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Vous ne pouvez pas envoyer de message à cet utilisateur' });
    }

    const newMessage = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content: content || '',
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    const message = await newMessage.save();
    res.json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ msg: 'Erreur serveur', error: error.message });
  }
});

// Obtenir les conversations de l'utilisateur
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user.id }, { recipient: req.user.id }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user.id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$recipient', req.user.id] },
                  { $eq: ['$read', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: { _id: 1, username: 1 },
          lastMessage: 1,
          unreadCount: 1
        }
      }
    ]);
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// Obtenir les messages d'une conversation
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    // Marquer les messages comme lus
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;