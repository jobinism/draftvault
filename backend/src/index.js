require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cache = new NodeCache({ stdTTL: 3600 });

app.use(cors());
app.use(express.json());

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    return;
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// Home route
app.get('/', (req, res) => {
  res.send('DraftVault: Fantasy Football with Crypto Prizes');
});

// API-Sports Players
app.get('/players', async (req, res) => {
  const season = req.query.season || '2023';
  const cacheKey = `players-${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const playersData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', `players_${season}.json`)));
    cache.set(cacheKey, playersData);
    res.json(playersData);
  } catch (error) {
    console.error('Failed to load players:', error.message);
    res.status(500).json({ error: 'Failed to load players' });
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
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, hashedPassword, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({ error: 'Email already exists or database error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// League Creation Route
app.post('/leagues/create', async (req, res) => {
  const { name, maxPlayers, settings, userId, currency } = req.body;
  if (!name || !maxPlayers || !userId || !currency) {
    return res.status(400).json({ error: 'Missing required fields: name, maxPlayers, userId, currency' });
  }
  if (![10, 12].includes(maxPlayers)) {
    return res.status(400).json({ error: 'Invalid player count' });
  }
  if (!['SOL', 'USDC', 'JUP'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: `User with ID ${userId} does not exist` });
    }
  } catch (error) {
    console.error('User check error:', error.message);
    return res.status(500).json({ error: 'Database error during user validation' });
  }

  const creationFee = maxPlayers === 10 ? 10 : 15;
  const paymentVerified = true; // Mock payment verification

  if (!paymentVerified) {
    return res.status(400).json({ error: `Payment required ($${creationFee})` });
  }

  try {
    const result = await pool.query(
      'INSERT INTO leagues (name, commissioner_id, settings, currency, prize_fee_percentage, creation_fee, max_players) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, userId, settings || {}, currency, 2.0, creationFee, maxPlayers]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create league:', error.message);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// Draft Route
app.post('/teams/draft', async (req, res) => {
  const { teamId, playerId } = req.body;
  if (!teamId || !playerId) {
    return res.status(400).json({ error: 'Missing required fields: teamId, playerId' });
  }

  try {
    // Check if team exists
    const teamCheck = await pool.query('SELECT roster FROM teams WHERE id = $1', [teamId]);
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({ error: `Team with ID ${teamId} does not exist` });
    }

    // Ensure roster is an array
    let currentRoster = teamCheck.rows[0].roster || [];
    if (!Array.isArray(currentRoster)) {
      console.error('Invalid roster format:', currentRoster);
      currentRoster = [];
    }

    // Check if player is already drafted
    if (currentRoster.some(p => p.playerId === playerId)) {
      return res.status(400).json({ error: `Player ${playerId} already drafted` });
    }

    // Add new player to roster
    currentRoster.push({ playerId: parseInt(playerId), draftedAt: new Date().toISOString() });

    // Debug: Log the roster before update
    console.log('Updating roster with:', JSON.stringify(currentRoster));

    // Update the roster in the database
    const result = await pool.query(
      'UPDATE teams SET roster = $1::jsonb WHERE id = $2 RETURNING *',
      [JSON.stringify(currentRoster), teamId]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to draft player:', error.message, error.stack);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});