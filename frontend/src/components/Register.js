import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await axios.post('/auth/register', { email, password, username });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
      alert('Registration successful!');
      navigate('/create-league');
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="p-4 bg-solana-blue min-h-screen text-white">
      <h2 className="text-2xl font-bold">Register</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="block w-full p-2 mt-2 bg-solana-light text-solana-gray rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="block w-full p-2 mt-2 bg-solana-light text-solana-gray rounded"
      />
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="block w-full p-2 mt-2 bg-solana-light text-solana-gray rounded"
      />
      <button
        onClick={handleRegister}
        className="mt-4 px-4 py-2 bg-solana-purple text-white rounded hover:bg-solana-green"
      >
        Register
      </button>
    </div>
  );
};

export default Register;