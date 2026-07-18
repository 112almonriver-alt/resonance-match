import { MusicProviderAdapter } from "./MusicProviderAdapter.js";

/**
 * Адаптер для Яндекс Музыки через парсинг HTML страницы плейлиста
 * (а не через внутренний API — см. yandexMusicAdapter.js для этого варианта).
 *
 * ВАЖНО — прочитайте перед использованием:
 * 1. robots.txt music.yandex.ru прямо запрещает автоматический доступ для
 *    краулеров/ботов. Этот код игнорирует эту директиву — используется по
 *    осознанному решению после явного предупреждения (см. историю обсуждения
 *    в ТЗ/README). Это более высокий юридический риск, чем обращение к
 *    незадокументированному API.
 * 2. Мы не смогли напрямую проверить точную структуру встроенных данных на
 *    странице (тот же robots.txt заблокировал и наш собственный просмотр).
 *    Поэтому парсер ищет данные "умно" — рекурсивно обходит найденный JSON
 *    и вытаскивает всё, что похоже на трек (title + artists[].name), а не
 *    полагается на один жёстко прописанный путь. Это делает его более
 *    устойчивым к изменениям структуры, но не гарантирует работу, если
 *    Яндекс вообще перестанет встраивать данные в HTML (например, полностью
 *    перейдёт на подгрузку через отдельные XHR-запросы после рендера).
 * 3. Жанров на странице плейлиста нет — это обогащается отдельно через
 *    Last.fm (см. enrichment/lastfm.js), не через этот адаптер.
 */
export class YandexMusicScrapeAdapter extends MusicProviderAdapter {
  get providerName() {
    return "yandex-scrape";
  }

  canHandle(url) {
    return /music\.yandex\.(ru|com|by|kz|uz)\/users\/[^/]+\/playlists\/\d+/.test(url);
  }

  async getTracksByPlaylistUrl(url) {
    const html = await this._fetchHtml(url);
    const jsonBlobs = this._extractJsonBlobs(html);

    if (jsonBlobs.length === 0) {
      throw new Error(
        "Не удалось найти встроенные данные на странице плейлиста Яндекс Музыки. " +
          "Возможно, структура страницы изменилась — адаптер нужно обновить."
      );
    }

    const found = [];
    const seen = new Set();
    for (const blob of jsonBlobs) {
      this._findTracksInObject(blob, found, seen);
    }

    const unique = [];
    const seenKeys = new Set();
    for (const track of found) {
      const key = `${track.title}::${track.artist}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        unique.push(track);
      }
    }

    if (unique.length === 0) {
      throw new Error(
        "На странице плейлиста не нашлось ни одного трека. Убедитесь, что плейлист публичный, " +
          "либо структура страницы изменилась и парсер нужно обновить."
      );
    }

    return unique;
  }

  async _fetchHtml(url) {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Не удалось загрузить страницу плейлиста (${response.status})`);
    }

    return response.text();
  }

  _extractJsonBlobs(html) {
    const blobs = [];

    const scriptJsonRe = /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptJsonRe.exec(html)) !== null) {
      const parsed = this._tryParseJson(match[1]);
      if (parsed) blobs.push(parsed);
    }

    const assignmentRe = /(?:var|window\.[\w.]+|const|let)\s*[\w.]*\s*=\s*\{/g;
    while ((match = assignmentRe.exec(html)) !== null) {
      const start = match.index + match[0].length - 1;
      const jsonText = this._extractBalancedBraces(html, start);
      if (jsonText) {
        const parsed = this._tryParseJson(jsonText);
        if (parsed) blobs.push(parsed);
      }
    }

    return blobs;
  }

  _tryParseJson(text) {
    try {
      return JSON.parse(text.trim());
    } catch {
      return null;
    }
  }

  _extractBalancedBraces(text, openBraceIndex) {
    let depth = 0;
    let inString = false;
    let stringChar = "";
    let escaped = false;

    for (let i = openBraceIndex; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === stringChar) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === "{") depth++;
      if (char === "}") {
        depth--;
        if (depth === 0) {
          return text.slice(openBraceIndex, i + 1);
        }
      }

      if (i - openBraceIndex > 5_000_000) return null;
    }

    return null;
  }

  _findTracksInObject(obj, found, seen, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 40) return;
    if (seen.has(obj)) return;
    seen.add(obj);

    if (Array.isArray(obj)) {
      for (const item of obj) this._findTracksInObject(item, found, seen, depth + 1);
      return;
    }

    const looksLikeTrack =
      typeof obj.title === "string" &&
      obj.title.length > 0 &&
      Array.isArray(obj.artists) &&
      obj.artists.length > 0 &&
      obj.artists.every((a) => a && typeof a.name === "string");

    if (looksLikeTrack) {
      found.push({
        title: obj.title,
        artist: obj.artists.map((a) => a.name).join(", "),
        genres: [],
      });
    }

    for (const key of Object.keys(obj)) {
      this._findTracksInObject(obj[key], found, seen, depth + 1);
    }
  }
}
