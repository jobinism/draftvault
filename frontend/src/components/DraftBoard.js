import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DraftBoard = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const teamId = 1; // Mock team ID, replace with dynamic value
  const season = '2023'; // Update to 2024/2025 when available

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/players?season=${season}`);
        if (!Array.isArray(response.data)) {
          throw new Error('Expected an array of players');
        }
        setPlayers(response.data);
        setFilteredPlayers(response.data);
        setError('');
      } catch (error) {
        console.error('Failed to fetch players:', error.message);
        setError(`Failed to fetch players: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  // Filter players by search term and position
  useEffect(() => {
    let filtered = players;
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedPosition) {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }
    setFilteredPlayers(filtered);
  }, [searchTerm, selectedPosition, players]);

  const handleDraft = async (playerId) => {
    try {
      const response = await axios.post('/teams/draft', { teamId, playerId });
      alert(`Player ${playerId} drafted to team ${teamId}`);
    } catch (error) {
      console.error('Failed to draft player:', error.response?.data || error.message);
      alert(`Failed to draft player: ${error.response?.data?.error || error.message}`);
    }
  };

  // Unique positions for dropdown
  const positions = [...new Set(players.map(player => player.position))].sort();

  return (
    <div className="p-4 bg-solana-blue min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">Draft Board</h2>
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded bg-solana-light text-solana-gray w-1/2"
        />
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="p-2 rounded bg-solana-light text-solana-gray"
        >
          <option value="">All Positions</option>
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>
      {loading && <p>Loading players...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && filteredPlayers.length === 0 && <p>No players available for season {season}.</p>}
      {!loading && !error && filteredPlayers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPlayers.map(player => (
            <div
              key={`${player.id}-${player.team_id}`} // Unique key to avoid duplicates
              className="bg-white p-4 rounded-lg shadow-md"
            >
              <p className="text-solana-gray font-bold">{player.name}</p>
              <p className="text-solana-gray">
                {player.team_name || 'Unknown Team'} - {player.position || 'Unknown Position'}
              </p>
              <button
                onClick={() => handleDraft(player.id)}
                className="mt-2 px-4 py-2 bg-solana-purple text-white rounded hover:bg-solana-green"
              >
                Draft
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftBoard;