const API_BASE = "https://ws.audioscrobbler.com/2.0/";

const artistGenreCache = new Map();

export async function getArtistGenres(artistName, apiKey) {
  if (!apiKey || !artistName) return [];

  const cacheKey = artistName.toLowerCase();
  if (artistGenreCache.has(cacheKey)) {
    return artistGenreCache.get(cacheKey);
  }

  try {
    const url = `${API_BASE}?method=artist.gettoptags&artist=${encodeURIComponent(
      artistName
    )}&api_key=${apiKey}&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
      artistGenreCache.set(cacheKey, []);
      return [];
    }

    const data = await response.json();
    const tags = data.toptags?.tag ?? [];

    const genres = tags
      .slice(0, 3)
      .map((t) => t.name?.toLowerCase())
      .filter(Boolean);

    artistGenreCache.set(cacheKey, genres);
    return genres;
  } catch {
    artistGenreCache.set(cacheKey, []);
    return [];
  }
}

export async function enrichTracksWithGenres(tracks, apiKey) {
  if (!apiKey) return tracks;

  const results = [];
  for (const track of tracks) {
    const genres = await getArtistGenres(track.artist, apiKey);
    results.push({ ...track, genres });
  }
  return results;
}
