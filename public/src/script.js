const { decay, spring, tween } = window.popmotion;

// Helper to handle refresh logic and retry
async function safeFetch(url) {
  let res = await fetch(url);

  // If unauthorized, try refreshing the token
  if (res.status === 401) {
    console.warn("Access token expired. Attempting to refresh...");
    const refreshRes = await fetch('/refresh_token');
    if (refreshRes.ok) {
      res = await fetch(url); // Retry original request
    } else {
      alert("Session expired. Please log in again.");
      return null;
    }
  }

  return res.json();
}

async function fetchAlbums() {
  const res = await fetch(`http://127.0.0.1:8080/me/albums`);
  const data = await res.json();
  const container = document.getElementById('album-container');
  container.innerHTML = '';

  // if (!data || !data.items) {
  //   document.getElementById('album-container').innerHTML = '<p>Unable to load albums.</p>';
  //   return;
  // }

  if (res.status === 401) {
    alert('You must log in to Spotify first.');
    return;
  }

  data.items.forEach(item => {
    const card = AlbumCard(item.album);
    container.appendChild(card);
  });
}

async function fetchTopTracks() {
  console.log("Fetching top tracks...");
  const res = await fetch(`http://127.0.0.1:8080/me/top/tracks`);
  const data = await res.json();
  console.log("Top Tracks Response:", data);

  const container = document.getElementById('song-container');
  container.innerHTML = '';

  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<p>No top tracks found.</p>';
    return;
  }

  data.items.forEach(track => {
    const card = SongCard(track);
    container.appendChild(card);
  });
}

async function fetchTopArtists() {
  console.log("Fetching top artists...");
  const res = await fetch(`http://127.0.0.1:8080/me/top/artists`);
  const data = await res.json();

  const container = document.getElementById('artist-container');
  container.innerHTML = '';

  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<p>No top tracks found.</p>';
    return;
  }

  data.items.forEach(artist => {
    const card = ArtistCard(artist);
    container.appendChild(card);
  });
}

// ALBUM CARD: with decay animation
function AlbumCard(album) {
  const col = document.createElement('div');
  col.className = 'col-md-3';
  const div = document.createElement('div');
  div.className = 'album-card';

  div.innerHTML = `
    <img src="${album.images[0]?.url}" alt="${album.name}">
    <h5>${album.name}</h5>
    <p>${album.artists.map(a => a.name).join(', ')}</p>
  `;

  col.appendChild(div);
  animateDecay(div);
  return col;
}

// SONG CARD: with tween animation
function SongCard(track) {
  const col = document.createElement('div');
  col.className = 'col-md-3';
  const div = document.createElement('div');
  div.className = 'song-card';

  div.innerHTML = `
    <img src="${track.album.images[0]?.url}" alt="${track.name}">
    <h5>${track.name}</h5>
    <p>${track.artists.map(a => a.name).join(', ')}</p>
  `;

  col.appendChild(div);
  animateFadeIn(div);
  return col;
}

// ARTIST CARD: with spring animation
function ArtistCard(artist) {
  const col = document.createElement('div');
  col.className = 'col-md-3';
  const div = document.createElement('div');
  div.className = 'artist-card';

  div.innerHTML = `
    <img src="${artist.images[0]?.url}" alt="${artist.name}">
    <h5>${artist.name}</h5>
    <p>Genres: ${artist.genres.slice(0, 3).join(', ')}</p>
  `;

  col.appendChild(div);
  animateSpring(div);
  return col;
}

// Animation functions
function animateDecay(element) {
  element.style.transform = 'translateX(200px)';
  element.style.opacity = '0';
  setTimeout(() => {
    decay({
      velocity: -300,
      from: 200,
      timeConstant: 300,
    }).start({
      update: v => {
        element.style.transform = `translateX(${v}px)`;
        element.style.opacity = `${1 - Math.abs(v) / 200}`;
      },
      complete: () => {
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
      }
    });
  }, 10);
}

function animateFadeIn(element) {
  element.style.opacity = '0';
  tween({ from: 0, to: 1, duration: 600 }).start({
    update: v => {
      element.style.opacity = v;
    }
  });
}

function animateSpring(element) {
  element.style.transform = 'scale(0.5)';
  spring({ from: 0.5, to: 1, stiffness: 200, damping: 10 }).start({
    update: v => {
      element.style.transform = `scale(${v})`;
    }
  });
}

window.fetchAlbums = fetchAlbums;
window.fetchTopTracks = fetchTopTracks;
window.fetchTopArtists = fetchTopArtists;
