// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();
const port = 8080;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // your frontend
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:8080/callback';
let access_token = '';

// Redirect to Spotify login
app.get('/login', (req, res) => {
  const scopes = 'user-library-read user-top-read';
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

// Spotify redirects back here with ?code=
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  access_token = data.access_token;

  res.redirect('/'); // Go back to frontend
});

// Proxy endpoints to Spotify API
const withAuth = (handler) => async (req, res) => {
  if (!access_token) return res.status(401).json({ error: 'Not logged in' });
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Spotify API failed' });
  }
};

app.get('/me/albums', withAuth(async (req, res) => {
  const r = await fetch('https://api.spotify.com/v1/me/albums', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const data = await r.json();
  res.json(data);
}));

app.get('/me/top/tracks', withAuth(async (req, res) => {
  const r = await fetch('https://api.spotify.com/v1/me/top/tracks', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const data = await r.json();
  res.json(data);
}));

app.get('/me/top/artists', withAuth(async (req, res) => {
  const r = await fetch('https://api.spotify.com/v1/me/top/artists', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const data = await r.json();
  res.json(data);
}));

app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});
