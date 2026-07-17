/**
 * Базовый интерфейс, который должен реализовать каждый адаптер провайдера
 * (Spotify, Яндекс Музыка, SoundCloud и т.д.)
 *
 * Ядро приложения работает только с этим интерфейсом и никогда
 * не знает деталей конкретного провайдера — это позволяет
 * добавлять новые сервисы, не трогая логику матчинга.
 */
export class MusicProviderAdapter {
  /** Имя провайдера, например "spotify" */
  get providerName() {
    throw new Error("providerName must be implemented");
  }

  /**
   * Проверяет, относится ли ссылка к этому провайдеру
   * @param {string} url
   * @returns {boolean}
   */
  canHandle(url) {
    throw new Error("canHandle(url) must be implemented");
  }

  /**
   * Достаёт список треков из публичного плейлиста по ссылке
   * @param {string} url
   * @returns {Promise<Track[]>}
   */
  async getTracksByPlaylistUrl(url) {
    throw new Error("getTracksByPlaylistUrl(url) must be implemented");
  }
}

/**
 * @typedef {Object} Track
 * @property {string} title
 * @property {string} artist
 * @property {string[]} genres
 */
