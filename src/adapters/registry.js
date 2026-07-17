import { SpotifyAdapter } from "./spotifyAdapter.js";
import { YandexMusicAdapter } from "./yandexMusicAdapter.js";

/**
 * Реестр всех подключённых провайдеров.
 * Чтобы добавить SoundCloud — реализуйте новый класс по образцу
 * spotifyAdapter.js / yandexMusicAdapter.js и добавьте его сюда.
 */
export function createAdapterRegistry(config) {
  const adapters = [
    new SpotifyAdapter({
      clientId: config.spotifyClientId,
      clientSecret: config.spotifyClientSecret,
    }),
    new YandexMusicAdapter({
      token: config.yandexMusicToken,
    }),
    // new SoundCloudAdapter(...),
  ];

  return {
    /** Находит адаптер, способный обработать данную ссылку */
    findAdapterForUrl(url) {
      const adapter = adapters.find((a) => a.canHandle(url));
      if (!adapter) {
        throw new Error(
          "Ссылка не распознана. Поддерживаются плейлисты Spotify (скоро — Яндекс Музыка, SoundCloud)."
        );
      }
      return adapter;
    },
  };
}
