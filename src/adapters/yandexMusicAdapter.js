import { MusicProviderAdapter } from "./MusicProviderAdapter.js";

const API_BASE = "https://api.music.yandex.net";

/**
 * Адаптер для Яндекс Музыки.
 *
 * ВАЖНО: официального публичного API у Яндекс Музыки нет (см. ТЗ, раздел рисков).
 * Этот адаптер обращается к внутреннему API, которым пользуется веб/мобильный клиент,
 * по структуре, задокументированной сообществом (открытые библиотеки-обёртки на
 * Python/Node/.NET). Она может измениться без предупреждения — при сбоях сначала
 * проверяйте, не изменился ли формат ответа.
 *
 * Работает БЕЗ логина пользователя — только для публичных плейлистов, что и было
 * решением по итогам обсуждения юридических рисков.
 */
export class YandexMusicAdapter extends MusicProviderAdapter {
  constructor({ token } = {}) {
    super();
    // Токен опционален: часть публичных данных отдаётся и без него,
    // но некоторые эндпоинты Яндекс постепенно требуют авторизацию even для чтения.
    // Получить свой токен для тестов: https://yandex-music.readthedocs.io/en/main/token.html
    this.token = token;
  }

  get providerName() {
    return "yandex";
  }

  canHandle(url) {
    return /music\.yandex\.(ru|com|by|kz|uz)\/users\/[^/]+\/playlists\/\d+/.test(url);
  }

  _extractPlaylistRef(url) {
    const match = url.match(/users\/([^/]+)\/playlists\/(\d+)/);
    if (!match) {
      throw new Error(
        "Не удалось распознать ссылку на плейлист Яндекс Музыки. Ожидается формат: music.yandex.ru/users/{логин}/playlists/{id}"
      );
    }
    return { userId: decodeURIComponent(match[1]), kind: match[2] };
  }

  _headers() {
    const headers = { Accept: "application/json" };
    if (this.token) headers.Authorization = `OAuth ${this.token}`;
    return headers;
  }

  async getTracksByPlaylistUrl(url) {
    const { userId, kind } = this._extractPlaylistRef(url);

    // Шаг 1: получаем сам плейлист — там только краткие ссылки на треки (id + albumId)
    const playlistRes = await fetch(
      `${API_BASE}/users/${encodeURIComponent(userId)}/playlists/${kind}`,
      { headers: this._headers() }
    );

    if (!playlistRes.ok) {
      throw new Error(
        `Не удалось получить плейлист Яндекс Музыки (${playlistRes.status}). ` +
          `Убедитесь, что плейлист публичный, либо что структура неофициального API не изменилась.`
      );
    }

    const playlistData = await playlistRes.json();
    const shortTracks = playlistData.result?.tracks ?? [];

    if (shortTracks.length === 0) return [];

    // Шаг 2: у плейлиста только id треков — полную информацию (название, артисты, жанр)
    // нужно запросить отдельно батчем через /tracks
    const trackRefs = shortTracks
      .map((t) => (t.id != null ? `${t.id}:${t.albumId ?? ""}` : null))
      .filter(Boolean);

    const tracksRes = await fetch(`${API_BASE}/tracks`, {
      method: "POST",
      headers: { ...this._headers(), "Content-Type": "application/x-www-form-urlencoded" },
      body: `track-ids=${trackRefs.join(",")}`,
    });

    if (!tracksRes.ok) {
      throw new Error(`Не удалось получить данные треков Яндекс Музыки (${tracksRes.status})`);
    }

    const tracksData = await tracksRes.json();
    const fullTracks = tracksData.result ?? [];

    return fullTracks.map((t) => ({
      title: t.title,
      artist: (t.artists ?? []).map((a) => a.name).join(", "),
      // У Яндекс Музыки жанр обычно живёт на уровне альбома, а не трека
      genres: (t.albums ?? [])
        .map((a) => a.genre)
        .filter(Boolean),
    }));
  }
}
