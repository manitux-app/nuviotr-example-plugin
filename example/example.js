const movieItems = [
  {
    // `id`, Nuvio'nun ayrıntı sayfası URL'sine gönderilir. `example:` öneki
    // bu kimliğin bu plugine ait olduğunu belirtir; devamındaki değer eklentinin
    // kendi opak içerik anahtarıdır. Bu sayede başka pluginlerdeki kimliklerle
    // çakışmaz ve getStreams/comments çağrılarında güvenle kullanılabilir.
    id: "example:movie:278",
    name: "Esaretin Bedeli",
    type: "movie",
    year: 1994,
    description: "Örnek film öğesi.",
    externalIds: { tmdbId: "278", imdbId: "tt0111161" }
  }
];

const seriesItems = [
  {
    id: "example:series:1399",
    name: "Taht Oyunları",
    type: "series",
    year: 2011,
    description: "Örnek dizi öğesi.",
    externalIds: { tmdbId: "1399", imdbId: "tt0944947" }
  }
];

const moviePageTwoItems = [
  {
    id: "example:movie:680",
    name: "Ucuz Roman",
    type: "movie",
    year: 1994,
    description: "Film kataloğunun ikinci sayfası.",
    externalIds: { tmdbId: "680", imdbId: "tt0110912" }
  }
];

const seriesPageTwoItems = [
  {
    id: "example:series:1402",
    name: "Yürüyen Ölüler",
    type: "series",
    year: 2010,
    description: "Dizi kataloğunun ikinci sayfası.",
    externalIds: { tmdbId: "1402", imdbId: "tt1520211" }
  }
];

function allItems() {
  return movieItems.concat(seriesItems, moviePageTwoItems, seriesPageTwoItems);
}


async function getCatalog({ catalogId, type, pageToken, language }) {
  // `pageToken` opaktır: ofset olarak değil, yalnızca arama anahtarı olarak kullanın.
  if (catalogId === "featured-movies" && type === "movie") {
    if (pageToken == null) return { items: movieItems, nextPageToken: "featured-movies-page-2" };
    if (pageToken === "featured-movies-page-2") return { items: moviePageTwoItems, nextPageToken: null };
  }
  if (catalogId === "featured-series" && type === "series") {
    if (pageToken == null) return { items: seriesItems, nextPageToken: "featured-series-page-2" };
    if (pageToken === "featured-series-page-2") return { items: seriesPageTwoItems, nextPageToken: null };
  }
  return { items: [] };
}

async function search({ query, language }) {
  // Arama, katalog olarak bu eklenti seçildiğinde her zaman eklenti kapsamındadır.
  // getCatalog ile aynı öğe biçimini döndürün: { items: [...] }.
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return { items: [] };

  const items = allItems().filter((item) =>
    item.name.toLowerCase().includes(normalizedQuery)
  );
  return { items };
}

async function getStreams(id, mediaType, season, episode) {
  // Gelen isteğin bu pluginin kataloğundan mı yoksa tmdb id ile mi geldiğini kontrol edin
  // Bu fonksiyonun gerçek davranışı için rarefilm plugini kontrol edin
  if (String(id).startsWith("example:") && !id) return [];

  return [];
}

async function comments({ contentId, url, type, pageToken, language }) {
  // `contentId`, `url` ve `type`, bu eklentinin sahip olduğu katalog öğesini
  // tanımlar. İlk istekte `pageToken` null olur, sonraki değerler opaktır.
  // { comments: [{ id, author, text }], nextPageToken } döndürün. 
  const item = itemFromContentId(contentId);
  if (!item || item.id !== "example:movie:278") return { comments: [] };

  if (pageToken == null) {
    return {
      comments: [
        { id: "example-comment-1", author: "Mete", text: "Örnek yorum." }
      ],
      nextPageToken: "example-comments-page-2"
    };
  }

  if (pageToken === "example-comments-page-2") {
    return {
      comments: [
        { id: "example-comment-2", author: "Kağan", text: "İkinci sayfa örnek yorumu." }
      ],
      nextPageToken: null
    };
  }

  return { comments: [] };
}


// Kullanıcı bu eklentinin Ayarlar butonunu açtığında bu şema döner.
// Nuvio'nun kaydettiği değerler her eklenti çağrısında SCRAPER_SETTINGS içinde bulunur.
function getSettings() {
  return {
    title: "Örnek Sağlayıcı ayarları",
    fields: [
      {
        key: "baseUrl",
        label: "Sağlayıcı adresi",
        type: "text",
        default: "https://example.invalid"
      },
      {
        key: "apiToken",
        label: "API token",
        type: "password"
      }
    ]
  };
}

module.exports = { getCatalog, search, getStreams, comments, getSettings };
