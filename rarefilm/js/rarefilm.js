"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/rarefilm/index.ts
var index_exports = {};
__export(index_exports, {
  getCatalog: () => getCatalog,
  getStreams: () => getStreams,
  search: () => search
});
module.exports = __toCommonJS(index_exports);

// src/rarefilm/config.ts
var config = {
  id: "rarefilm",
  name: "!RareFilm",
  enabled: true,
  fallback: "https://rarefilmm.com",
  supportedTypes: ["movie"],
  searchOrder: ["title"]
};
var catalogs = [
  { id: "latest", name: "Son Eklenenler", path: "page" },
  { id: "action", name: "Aksiyon", path: "category/action/page" },
  { id: "adventure", name: "Macera", path: "category/adventure/page" },
  { id: "animation", name: "Animasyon", path: "category/animation/page" },
  { id: "camp", name: "Kamp", path: "category/camp/page" },
  { id: "comedy", name: "Komedi", path: "category/comedy/page" },
  { id: "documentary", name: "Belgesel", path: "category/documentary/page" },
  { id: "drama", name: "Dram", path: "category/drama/page" },
  { id: "erotic", name: "Erotik", path: "category/erotic/page" },
  { id: "family", name: "Aile", path: "category/family/page" },
  { id: "fantasy", name: "Fantastik", path: "category/fantasy/page" },
  { id: "mystery", name: "Gizem", path: "category/mystery/page" },
  { id: "theatre", name: "Tiyatro", path: "category/theatre/page" }
];

// src/rarefilm/index.ts
var userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
function headers(referer) {
  return {
    "User-Agent": userAgent,
    Accept: "*/*",
    Referer: referer,
    "Accept-Language": "en-US,en;q=0.9"
  };
}
async function siteRequest(url, referer) {
  const response = await fetch(url, {
    headers: headers(referer)
  });
  if (!response.ok) throw Error(`HTTP ${response.status}: ${new URL(url).hostname}`);
  const body = await response.text();
  if (/<title>\s*(?:Just a moment|Attention Required)/i.test(body)) throw Error("Cloudflare do\u011Frulamas\u0131 gerekiyor");
  return {
    body,
    url: response.url || url
  };
}
function absolute(value, base) {
  try {
    const input = value.trim().replace(/&amp;/g, "&");
    if (!input || /^(?:javascript|data|about):/i.test(input)) return void 0;
    const url = new URL(input.startsWith("//") ? `https:${input}` : input, base);
    return /^https?:$/.test(url.protocol) && !/@/.test(url.host) ? url.href : void 0;
  } catch {
    return void 0;
  }
}
function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  return result;
}
function text(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/&(?:amp|quot|apos|lt|gt|nbsp);/gi, (entity) => ({
    "&amp;": "&",
    "&quot;": '"',
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " "
  })[entity.toLowerCase()] || entity).replace(/\s+/g, " ").trim();
}
function normalized(value) {
  return text(value).toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function sameHost(url, base) {
  try {
    return new URL(url).host === new URL(base).host;
  } catch {
    return false;
  }
}
function postBlocks(html) {
  return Array.from(html.matchAll(/<div\b[^>]*class=["'][^"']*\bpost\b[^"']*["'][^>]*>[\s\S]*?(?=<div\b[^>]*class=["'][^"']*\bpost\b|$)/gi), (match) => match[0]);
}
function catalogItems(html, base) {
  const found = /* @__PURE__ */ new Map();
  for (const block of postBlocks(html)) {
    const heading = /<h2\b[^>]*>[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>/i.exec(block);
    if (!heading) continue;
    const url = absolute(attributes(heading[1]).href || "", base), name = text(heading[2]);
    if (!url || !name || !sameHost(url, base)) continue;
    const style = /<div\b[^>]*class=["'][^"']*\bfeatured-image\b[^"']*["'][^>]*style=["']([^"']+)/i.exec(block)?.[1] || "", poster = absolute(/url\(\s*['"]?([^'"\s)]+)/i.exec(style)?.[1] || "", base), path = new URL(url).pathname;
    found.set(path, {
      id: `rrf:${encodeURIComponent(path)}`,
      name,
      type: "movie",
      url,
      ...poster ? {
        poster
      } : {}
    });
  }
  return Array.from(found.values());
}
function catalogUrl(base, path, page) {
  if (!/^(?:page|category\/[a-z-]+\/page)$/.test(path)) throw Error("Ge\xE7ersiz katalog yolu");
  return `${base}/${path}/${page}/`;
}
function contentUrl(id, base) {
  if (!id.startsWith("rrf:")) return void 0;
  try {
    const path = decodeURIComponent(id.slice(4));
    if (!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\/?$/i.test(path)) return void 0;
    const url = new URL(path, base);
    return sameHost(url.href, base) ? url.href : void 0;
  } catch {
    return void 0;
  }
}
function searchUrl(base, query) {
  return `${base}/?s=${encodeURIComponent(query)}`;
}
function candidates(html, base, meta) {
  return catalogItems(html, base).filter((item) => meta.titles.some((title) => normalized(title) === normalized(item.name))).map((item) => item.url);
}
function matches(html, meta) {
  const title = text(/<h1\b[^>]*class=["'][^"']*\bentry-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || "");
  return !!title && meta.titles.some((item) => normalized(item) === normalized(title));
}
function iframeUrl(html, base) {
  const iframe = /<article\b[\s\S]*?<iframe\b([^>]*)>/i.exec(html)?.[1];
  return iframe ? absolute(attributes(iframe).src || "", base) : void 0;
}
async function metadata(id) {
  if (!/^\d+$/.test(id) || typeof TMDB_API_KEY !== "string" || !TMDB_API_KEY) throw Error("Ge\xE7ersiz medya kimli\u011Fi");
  const data = JSON.parse((await siteRequest(`https://api.themoviedb.org/3/movie/${id}?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=en-US&append_to_response=external_ids`, "")).body);
  return {
    titles: [data.title, data.original_title].filter((value) => typeof value === "string" && !!value),
    year: parseInt(data.release_date) || void 0
  };
}
function decodeEscapes(value) {
  return value.replace(/(?:\\&quot;|&quot;)/g, '"').replace(/\\\\/g, "\\").replace(/\\u([0-9a-f]{4})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
function okruStreams(html, pageUrl) {
  const payload = decodeEscapes(html), videosRaw = /"videos"\s*:\s*(\[[\s\S]*?\])/i.exec(payload)?.[1], subtitlesRaw = /"subtitleTracks"\s*:\s*(\[[\s\S]*?\])/i.exec(payload)?.[1];
  if (!videosRaw) return [];
  let videos = [], tracks = [];
  try {
    videos = JSON.parse(videosRaw);
  } catch {
    return [];
  }
  try {
    tracks = subtitlesRaw ? JSON.parse(subtitlesRaw) : [];
  } catch {
  }
  const mediaHeaders = headers(new URL(pageUrl).origin + "/"), subtitles = tracks.flatMap((track) => {
    const url = absolute(track.url || "", pageUrl);
    return url ? [{
      id: url,
      url,
      lang: track.language || "Unknown",
      headers: mediaHeaders
    }] : [];
  }), result = /* @__PURE__ */ new Map();
  for (const video of videos) {
    const url = absolute(video.url || "", pageUrl);
    const quality = String(video.name || "").toLowerCase().replace("mobile", "144p").replace("lowest", "240p").replace("low", "360p").replace("sd", "480p").replace("hd", "720p").replace("full", "1080p").replace("quad", "1440p").replace("ultra", "4k");
    if (url && !result.has(url)) result.set(url, {
      url,
      audio: quality || "Odnoklassniki",
      format: /\.mp4(?:[?#]|$)/i.test(url) ? "mp4" : /\.mkv(?:[?#]|$)/i.test(url) ? "mkv" : "m3u8",
      headers: mediaHeaders,
      subtitles
    });
  }
  return Array.from(result.values());
}
function createStream(source) {
  const quality = "1080p";
  return {
    name: `${config.name} - ${source.audio || "Dil belirtilmemi\u015F"}`,
    title: "manitux",
    description: `${quality} \u2022 ${source.format === "m3u8" ? "HLS" : source.format.toUpperCase()}`,
    quality,
    format: source.format,
    type: source.format,
    url: source.url,
    headers: source.headers,
    subtitles: source.subtitles
  };
}
function pageNumber(token) {
  if (token == null || token === "") return 1;
  if (!/^\d+$/.test(token)) return void 0;
  const page = Number(token);
  return page >= 1 && page <= 100 ? page : void 0;
}
async function getCatalog({
  catalogId,
  type,
  pageToken
}) {
  const catalog = catalogs.find((item) => item.id === catalogId), page = pageNumber(pageToken);
  if (!catalog || type !== "movie" || !page) return {
    items: []
  };
  try {
    const response = await siteRequest(catalogUrl(config.fallback, catalog.path, page), config.fallback + "/"), items = catalogItems(response.body, response.url);
    return {
      items,
      ...items.length ? {
        nextPageToken: String(page + 1)
      } : {}
    };
  } catch (error) {
    console.warn(`[${config.id}] Katalog:`, String(error));
    return {
      items: []
    };
  }
}
async function search({
  query
}) {
  const value = String(query || "").trim();
  if (!value) return {
    items: []
  };
  try {
    const response = await siteRequest(searchUrl(config.fallback, value), config.fallback + "/");
    return {
      items: catalogItems(response.body, response.url)
    };
  } catch (error) {
    console.warn(`[${config.id}] Arama:`, String(error));
    return {
      items: []
    };
  }
}
async function getStreams(id, mediaType, season, episode) {
  if (!config.enabled || mediaType !== "movie" || season !== void 0 || episode !== void 0) return [];
  try {
    const direct = contentUrl(String(id), config.fallback), meta = direct ? void 0 : await metadata(String(id));
    const search2 = direct ? void 0 : await siteRequest(searchUrl(config.fallback, meta.titles[0] || ""), config.fallback + "/");
    for (const candidate of (direct ? [direct] : candidates(search2.body, search2.url, meta)).slice(0, 8)) {
      const detail = await siteRequest(candidate, search2?.url || config.fallback + "/");
      if (meta && !matches(detail.body, meta)) continue;
      const iframe = iframeUrl(detail.body, detail.url);
      if (!iframe) continue;
      const player = await siteRequest(iframe, detail.url), streams = okruStreams(player.body, player.url).map(createStream);
      if (streams.length) return streams;
    }
  } catch (error) {
    console.warn(`[${config.id}] Ak\u0131\u015F:`, String(error));
  }
  return [];
}
