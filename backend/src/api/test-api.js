const axios = require('axios');

async function test() {
  try {
    // Test API-Sports
    const players = await axios.get('http://localhost:3000/players');
    console.log('Players:', players.data.slice(0, 5).map(p => p.name));

    // Test Jupiter mock
    const quote1 = await axios.post('http://localhost:3000/jupiter/quote', {
      inputMint: 'SOL',
      outputMint: 'USDC',
      amount: 1
    });
    console.log('SOL -> USDC:', quote1.data);

    const quote2 = await axios.post('http://localhost:3000/jupiter/quote', {
      inputMint: 'JUP',
      outputMint: 'USDC',
      amount: 100
    });
    console.log('JUP -> USDC:', quote2.data);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();