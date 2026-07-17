import { MusicProviderAdapter } from "./MusicProviderAdapter.js";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

/**
 * Адаптер для Spotify.
 * Использует Client Credentials Flow — то есть НЕ требует логина пользователя,
 * только серверные client_id/client_secret приложения. Подходит для чтения
 * публичных плейлистов, что официально разрешено условиями Spotify API.
 */
export class SpotifyAdapter extends MusicProviderAdapter {
  constructor({ clientId, clientSecret }) {
    super();
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this._token = null;
    this._tokenExpiresAt = 0;
  }

  get providerName() {
    return "spotify";
  }

  canHandle(url) {
    return /open\.spotify\.com\/playlist\//.test(url);
  }

  /** Извлекает ID плейлиста из ссылки вида https://open.spotify.com/playlist/{id}?si=... */
  _extractPlaylistId(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error("Не удалось распознать ссылку на плейлист Spotify");
    }
    return match[1];
  }

  /** Получает или переиспользует токен доступа (кэш до истечения срока действия) */
  async _getAccessToken() {
    const now = Date.now();
    if (this._token && now < this._tokenExpiresAt) {
      return this._token;
    }

    const basicAuth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Ошибка получения токена Spotify: ${response.status}`);
    }

    const data = await response.json();
    this._token = data.access_token;
    // отнимаем 60 секунд как запас, чтобы не словить протухший токен
    this._tokenExpiresAt = now + (data.expires_in - 60) * 1000;
    return this._token;
  }

  async getTracksByPlaylistUrl(url) {
    const playlistId = this._extractPlaylistId(url);
    const token = await this._getAccessToken();

    const response = await fetch(
      `${API_BASE}/playlists/${playlistId}?fields=tracks.items(track(name,artists(id,name)))`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка получения плейлиста Spotify: ${response.status}. Убедитесь, что плейлист публичный.`
      );
    }

    const data = await response.json();
    const items = data.tracks?.items ?? [];

    // Собираем уникальных артистов, чтобы за один проход получить их жанры
    const artistIds = [
      ...new Set(
        items.flatMap((item) =>
          (item.track?.artists ?? []).map((a) => a.id)
        )
      ),
    ].filter(Boolean);

    const genresByArtistId = await this._getGenresForArtists(artistIds, token);

    return items
      .filter((item) => item.track)
      .map((item) => ({
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        genres: item.track.artists.flatMap(
          (a) => genresByArtistId[a.id] ?? []
        ),
      }));
  }

  /** Spotify отдаёт жанры на уровне артиста, а не трека — забираем их батчами по 50 */
  async _getGenresForArtists(artistIds, token) {
    const genresByArtistId = {};
    const batchSize = 50;

    for (let i = 0; i < artistIds.length; i += batchSize) {
      const batch = artistIds.slice(i, i + batchSize);
      const response = await fetch(
        `${API_BASE}/artists?ids=${batch.join(",")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) continue;
      const data = await response.json();
      for (const artist of data.artists ?? []) {
        genresByArtistId[artist.id] = artist.genres ?? [];
      }
    }

    return genresByArtistId;
  }
}
