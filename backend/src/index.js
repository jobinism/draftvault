require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cache = new NodeCache({ stdTTL: 3600 });

app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.send('DraftVault: Fantasy Football with Crypto Prizes');
});

// API-Sports Players
app.get('/players', async (req, res) => {
  const season = req.query.season || '2024';
  const cacheKey = `players-${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(
      `https://v1.american-football.api-sports.io/players?season=${season}`,
      { headers: { 'x-apisports-key': process.env.API_SPORTS_KEY } }
    );
    const players = response.data.response;
    cache.set(cacheKey, players);
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Mock Jupiter Swap API
app.post('/jupiter/quote', (req, res) => {
  const { inputMint, outputMint, amount } = req.body;
  const mints = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    JUP: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
  };
  const prices = { SOL: 150, USDC: 1, JUP: 0.43 };

  if (!mints[inputMint] || !mints[outputMint]) {
    return res.status(400).json({ error: 'Invalid token mint' });
  }

  const inputValue = amount * prices[inputMint];
  const outputAmount = inputValue / prices[outputMint];
  res.json({
    inputMint: mints[inputMint],
    outputMint: mints[outputMint],
    inAmount: amount,
    outAmount: outputAmount,
    priceImpact: 0.01,
    route: `Mock route: ${inputMint} -> ${outputMint}`
  });
});

// Authentication Routes
app.post('/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, hashedPassword, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
});

// League Routes
app.post('/leagues/create', async (req, res) => {
  const { name, maxPlayers, settings, userId, currency } = req.body;
  if (![10, 12].includes(maxPlayers)) return res.status(400).json({ error: 'Invalid player count' });
  if (!['SOL', 'USDC', 'JUP'].includes(currency)) return res.status(400).json({ error: 'Invalid currency' });
  const creationFee = maxPlayers === 10 ? 10 : 15;
  const paymentVerified = true; // Mock payment
  if (!paymentVerified) return res.status(400).json({ error: `Payment required ($${creationFee})` });

  try {
    const result = await pool.query(
      'INSERT INTO leagues (name, commissioner_id, settings, currency, prize_fee_percentage, creation_fee, max_players) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, userId, settings, currency, 2.0, creationFee, maxPlayers]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create league' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});