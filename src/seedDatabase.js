require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

console.log('Connecting to MongoDB...'); // Pour le débogage

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const users = [
  { username: 'john_doe', email: 'john@example.com', password: 'password123' },
  { username: 'jane_smith', email: 'jane@example.com', password: 'password456' },
  { username: 'bob_johnson', email: 'bob@example.com', password: 'password789' },
];

const listings = [
  {
    title: 'Appartement cosy au cœur de Paris',
    description: 'Charmant appartement avec vue sur la Tour Eiffel',
    image: 'https://via.placeholder.com/300x200?text=Paris+Apartment',
    location: 'Paris, France',
    maxGuests: 2,
    amenities: ['WiFi', 'Cuisine', 'Vue sur la ville'],
  },
  {
    title: 'Villa spacieuse à Barcelone',
    description: 'Grande villa avec piscine, parfaite pour les familles',
    image: 'https://via.placeholder.com/300x200?text=Barcelona+Villa',
    location: 'Barcelone, Espagne',
    maxGuests: 6,
    amenities: ['Piscine', 'Jardin', 'Barbecue'],
  },
  {
    title: 'Studio moderne à New York',
    description: 'Studio récemment rénové au cœur de Manhattan',
    image: 'https://via.placeholder.com/300x200?text=NYC+Studio',
    location: 'New York, États-Unis',
    maxGuests: 2,
    amenities: ['WiFi', 'Climatisation', 'Salle de sport'],
  },
  {
    title: 'Maison traditionnelle à Kyoto',
    description: 'Expérience authentique dans une maison japonaise',
    image: 'https://via.placeholder.com/300x200?text=Kyoto+House',
    location: 'Kyoto, Japon',
    maxGuests: 4,
    amenities: ['Jardin zen', 'Bain traditionnel', 'Cérémonie du thé'],
  },
  {
    title: 'Loft artistique à Berlin',
    description: 'Loft spacieux dans un quartier branché de Berlin',
    image: 'https://via.placeholder.com/300x200?text=Berlin+Loft',
    location: 'Berlin, Allemagne',
    maxGuests: 3,
    amenities: ['Atelier d\'artiste', 'Vinyles', 'Vélos'],
  },
];

async function seedDatabase() {
  try {
    // Suppression des données existantes
    await User.deleteMany({});
    await Listing.deleteMany({});

    // Création des utilisateurs
    const createdUsers = await User.create(users);

    // Création des hébergements
    const listingsWithHosts = listings.map((listing, index) => ({
      ...listing,
      host: createdUsers[index % createdUsers.length]._id,
      availability: [
        {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      ],
    }));

    await Listing.create(listingsWithHosts);

    console.log('Base de données peuplée avec succès !');
  } catch (error) {
    console.error('Erreur lors du peuplement de la base de données:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedDatabase();