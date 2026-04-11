const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./src/config/database');
const sessionRoutes = require('./src/routes/sessionRoutes');
const userStoryRoutes = require('./src/routes/userStoryRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const socketHandler = require('./src/socket/socketHandler');

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.use('/api/sessions', sessionRoutes);
app.use('/api/stories', userStoryRoutes);

app.use(errorHandler);

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[${NODE_ENV.toUpperCase()}] Server running on port ${PORT}`);
  console.log(`Allowed origin: ${clientUrl}`);
});
