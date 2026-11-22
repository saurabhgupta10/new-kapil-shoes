import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import businessConfig from './config/business.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(PUBLIC_DIR));

// API Routes
app.use('/api', apiRouter);

// Specific page routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

app.get('/poster', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'poster.html'));
});

// Fallback to index.html for customer experience
app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start server only when run directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server')
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`👟 NEW KAPIL SHOES – QR Feedback & Review Assistant`);
    console.log(`====================================================`);
    console.log(`📍 Customer QR Experience:   http://localhost:${PORT}/`);
    console.log(`📊 Business Analytics Board: http://localhost:${PORT}/dashboard`);
    console.log(`🖨️ Printable A4 Poster:      http://localhost:${PORT}/poster`);
    console.log(`====================================================`);
  });
}

export default app;
