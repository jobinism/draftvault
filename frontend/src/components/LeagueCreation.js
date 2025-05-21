import React, { useState } from 'react';
import axios from 'axios';

const LeagueCreation = () => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('SOL');
  const [size, setSize] = useState(10);
  const fee = size === 10 ? 10 : 15;

  const handleCreate = async () => {
    try {
      const response = await axios.post('http://localhost:3000/leagues/create', {
        name,
        maxPlayers: size,
        settings: {},
        userId: 1, // Mock user ID
        currency
      });
      alert(`League created! Fee: $${fee}`);
    } catch (error) {
      alert('Failed to create league');
    }
  };

  return (
    <div className="p-4 bg-solana-blue min-h-screen text-white">
      <h2 className="text-2xl font-bold">Create a DraftVault League</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="League Name"
        className="block w-full p-2 mt-2 bg-solana-light text-solana-gray rounded"
      />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="block w-full p-2 mt-2 bg-solana-light text-solana-gray rounded"
      >
        <option value="SOL">Solana (SOL) - Volatile</option>
        <option value="USDC">USDC - Stable</option>
        <option value="JUP">Júpiter Coín (JUP) - Volatile</option>
      </select>
      <select
        value={size}
        onChange={(e) => setSize(parseInt(e.target.value))}
        className="block w-full p-2 mt-2 bg-solana-light text-solana-gray rounded"
      >
        <option value={10}>10 Players ($10)</option>
        <option value={12}>12 Players ($15)</option>
      </select>
      <p className="mt-2 text-sm">
        Temporary: $10/$15 creation fee (10/12 players) funds DraftVault’s development. 2% prize fee supports stats and servers.
      </p>
      <button
        onClick={handleCreate}
        className="mt-4 px-4 py-2 bg-solana-purple text-white rounded hover:bg-solana-green"
      >
        Create League
      </button>
    </div>
  );
};

export default LeagueCreation;