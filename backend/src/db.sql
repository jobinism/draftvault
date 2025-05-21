CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL
);

CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    commissioner_id INTEGER REFERENCES users(id),
    settings JSONB DEFAULT '{"passYards": 0.04, "passTD": 6, "rushYards": 0.1, "rushTD": 6, "recYards": 0.1, "recTD": 6}',
    currency VARCHAR(10) NOT NULL,
    prize_fee_percentage FLOAT DEFAULT 2.0,
    creation_fee FLOAT NOT NULL,
    max_players INTEGER NOT NULL
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    league_id INTEGER REFERENCES leagues(id),
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    roster JSONB DEFAULT '[]'
);

CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    week INTEGER NOT NULL,
    points FLOAT NOT NULL
);