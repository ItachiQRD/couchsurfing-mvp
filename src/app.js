const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const auth = require('./middleware/auth'); // Assurez-vous d'avoir ce middleware
const listingRoutes = require('./routes/listing');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type','x-auth-token', 'Accept', 'Authorization']
}));

app.use(express.json());

// Nouvelle route pour vérifier l'authentification
app.get('/api/auth/verify', auth, (req, res) => {
  res.json({ user: req.user });
});

app.use('/uploads', (req, res, next) => {
  console.log('Tentative d\'accès au fichier:', req.url);
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Routes existantes
app.use('/api/auth', require('./routes/Auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/listing', require('./routes/listing'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', listingRoutes);

app.use(errorHandler);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('Connecté à MongoDB'))
.catch((err) => {
  console.error('Erreur de connexion à MongoDB:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO');

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('sendMessage', ({ recipientId, content }) => {
    io.to(recipientId).emit('newMessage', { senderId: socket.id, content });
  });

  socket.on('disconnect', () => {
    console.log('Déconnexion Socket.IO');
  });

  app.use((req, res, next) => {
    res.status(404).json({ message: 'Route non trouvée' });
  });

});