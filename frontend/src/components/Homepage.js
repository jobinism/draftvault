import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Homepage = () => {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    axios.get('http://localhost:3000')
      .then(response => setMessage(response.data))
      .catch(() => setMessage('Error connecting to backend'));
  }, []);

  return (
    <div className="bg-solana-blue min-h-screen text-white p-4">
      <h1 className="text-3xl font-bold">DraftVault</h1>
      <p>{message}</p>
      <p className="mt-2">Fantasy Football with Crypto Prizes</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-solana-gray">My Leagues</h3>
          <p className="text-solana-gray">League: Super Bowl SOL - Record: 3-1</p>
          <p className="text-solana-gray">Next Matchup: vs. Team Green</p>
          <button className="mt-2 bg-solana-purple text-white p-2 rounded hover:bg-solana-green">
            View League
          </button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-solana-gray">Latest News</h3>
          <p className="text-solana-gray">Mahomes throws 3 TDs in Chiefs' victory!</p>
          <span className="text-solana-green text-sm">Just now</span>
        </div>
      </div>
    </div>
  );
};

export default Homepage;