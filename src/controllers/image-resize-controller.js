const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// ... autres imports et configurations

exports.createListing = [
  upload.array('images', 5),
  async (req, res) => {
    try {
      // ... autres validations et traitements

      const imagePaths = [];
      const thumbnailPaths = [];

      for (const file of req.files) {
        const filename = file.filename;
        const filepath = file.path;

        // Redimensionner l'image principale
        await sharp(filepath)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .toFile(path.join('uploads', 'resized-' + filename));

        // Créer une miniature
        await sharp(filepath)
          .resize(300, 200, { fit: 'cover' })
          .toFile(path.join('uploads', 'thumb-' + filename));

        // Supprimer l'original
        await fs.unlink(filepath);

        imagePaths.push('resized-' + filename);
        thumbnailPaths.push('thumb-' + filename);
      }

      const newListing = new Listing({
        // ... autres champs
        images: imagePaths,
        thumbnails: thumbnailPaths,
      });

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
