// backend/src/services/currencyService.js
const axios = require('axios');

const cache = {};
const CACHE_TTL = 3600 * 1000; // 1 hour

async function fetchRate(from, to) {
  if (from === to) return 1;
  const cacheKey = `${from}_${to}`;
  
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].rate;
  }

  try {
    const response = await axios.get(`https://open.er-api.com/v6/latest/${from}`);
    const rate = response.data.rates[to];
    if (!rate) throw new Error(`Rate not found for ${to}`);
    
    cache[cacheKey] = {
      rate,
      timestamp: Date.now()
    };
    return rate;
  } catch (error) {
    console.error(`Error fetching rate from ${from} to ${to}:`, error.message);
    return 1; // Fallback to 1:1 if API fails
  }
}

module.exports = { fetchRate };
