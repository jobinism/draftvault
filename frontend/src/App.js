import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import LeagueCreation from './components/LeagueCreation';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/create-league" element={<LeagueCreation />} />
      </Routes>
    </Router>
  );
}

export default App;