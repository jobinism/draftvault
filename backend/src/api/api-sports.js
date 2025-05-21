const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

const API_KEY = process.env.API_SPORTS_KEY;

async function getPlayers(season = '2024') {
  const cacheKey = `players-${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(
      `https://v1.american-football.api-sports.io/players?season=${season}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    const players = response.data.response;
    cache.set(cacheKey, players);
    return players;
  } catch (error) {
    console.error('Error fetching players:', error.message);
    throw error;
  }
}

async function getPlayerStats(season = '2024') {
  const cacheKey = `stats-${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(
      `https://v1.american-football.api-sports.io/statistics/players?season=${season}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    const stats = response.data.response;
    cache.set(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    throw error;
  }
}

module.exports = { getPlayers, getPlayerStats };