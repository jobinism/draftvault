import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import LeagueCreation from './components/LeagueCreation';
import Register from './components/Register';
import Login from './components/Login';
import DraftBoard from './components/DraftBoard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/create-league" element={<LeagueCreation />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/draft" element={<DraftBoard />} />
      </Routes>
    </Router>
  );
}

export default App;