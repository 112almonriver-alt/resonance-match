import { SpotifyAdapter } from "./spotifyAdapter.js";
import { YandexMusicScrapeAdapter } from "./yandexMusicScrapeAdapter.js";

export function createAdapterRegistry(config) {
  const adapters = [
    new SpotifyAdapter({
      clientId: config.spotifyClientId,
      clientSecret: config.spotifyClientSecret,
    }),
    new YandexMusicScrapeAdapter(),
  ];

  return {
    findAdapterForUrl(url) {
      const adapter = adapters.find((a) => a.canHandle(url));
      if (!adapter) {
        throw new Error(
          "Ссылка не распознана. Поддерживаются плейлисты Spotify и Яндекс Музыки."
        );
      }
      return adapter;
    },
  };
}
