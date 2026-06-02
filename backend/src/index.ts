// Entry point: wires up Express, MongoDB, and routes
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues';
import insightsRoutes from './routes/insights';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // explicitly handle preflight for all routes
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/venues', venueRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
