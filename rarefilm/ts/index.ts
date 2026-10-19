import { catalogs, config } from './config';

type StreamFormat = 'm3u8' | 'mp4' | 'mkv';
declare const TMDB_API_KEY: unknown;
interface Stream {
	name: string;title: string;description: string;quality: string;format: StreamFormat;type: StreamFormat;url: string;headers: Record < string,
	string > ;subtitles: Subtitle[];
}
interface Subtitle {
	id: string;url: string;lang: string;headers: Record < string,
	string > ;
}
interface CatalogItem {
	id: string;name: string;type: 'movie';url: string;poster ? : string;
}
interface Metadata {
	titles: string[];year ? : number;
}
interface OkRuVideo {
	name: string;url: string;
}
interface OkRuSubtitle {
	url: string;language ? : string;
}
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Site ve oynatıcı isteklerinde gereken standart başlıkları oluşturur.
function headers(referer: string): Record < string, string > {
	return {
		'User-Agent': userAgent,
		Accept: '*/*',
		Referer: referer,
		'Accept-Language': 'en-US,en;q=0.9'
	};
}

// Sayfayı indirir ve HTTP ile Cloudflare hatalarını bildirir.
async function siteRequest(url: string, referer: string): Promise < {
	body: string;url: string
} > {
	const response = await fetch(url, {
		headers: headers(referer)
	});
	if (!response.ok) throw Error(`HTTP ${response.status}: ${new URL(url).hostname}`);
	const body = await response.text();
	if (/<title>\s*(?:Just a moment|Attention Required)/i.test(body)) throw Error('Cloudflare doğrulaması gerekiyor');
	return {
		body,
		url: response.url || url
	};
}

// Güvenli ve mutlak bir HTTP adresi üretir.
function absolute(value: string, base: string): string | undefined {
	try {
		const input = value.trim().replace(/&amp;/g, '&');
		if (!input || /^(?:javascript|data|about):/i.test(input)) return undefined;
		const url = new URL(input.startsWith('//') ? `https:${input}` : input, base);
		return /^https?:$/.test(url.protocol) && !/@/.test(url.host) ? url.href : undefined;
	} catch {
		return undefined;
	}
}

// HTML etiketindeki öznitelikleri anahtar-değer nesnesine çevirir.
function attributes(tag: string): Record < string, string > {
	const result: Record < string, string > = {};
	for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
	return result;
}

// HTML etiketlerini ve temel karakter varlıklarını temizler.
function text(value: string): string {
	return value.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|quot|apos|lt|gt|nbsp);/gi, entity => ({
		'&amp;': '&',
		'&quot;': '"',
		'&apos;': "'",
		'&lt;': '<',
		'&gt;': '>',
		'&nbsp;': ' '
	} [entity.toLowerCase()] || entity)).replace(/\s+/g, ' ').trim();
}

// Başlık karşılaştırması için metni sadeleştirir.
function normalized(value: string): string {
	return text(value).toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Bağlantının seçili RareFilm alan adına ait olduğunu doğrular.
function sameHost(url: string, base: string): boolean {
	try {
		return new URL(url).host === new URL(base).host;
	} catch {
		return false;
	}
}

// Katalog sayfasını tek tek içerik kartı bloklarına ayırır.
function postBlocks(html: string): string[] {
	return Array.from(html.matchAll(/<div\b[^>]*class=["'][^"']*\bpost\b[^"']*["'][^>]*>[\s\S]*?(?=<div\b[^>]*class=["'][^"']*\bpost\b|$)/gi), match => match[0]);
}

// Kartlardan NuvioTR'nin kullanacağı film kayıtlarını oluşturur.
function catalogItems(html: string, base: string): CatalogItem[] {
	const found = new Map < string,
		CatalogItem > ();
	for (const block of postBlocks(html)) {
		const heading = /<h2\b[^>]*>[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>/i.exec(block);
		if (!heading) continue;
		const url = absolute(attributes(heading[1]).href || '', base),
			name = text(heading[2]);
		if (!url || !name || !sameHost(url, base)) continue;
		const style = /<div\b[^>]*class=["'][^"']*\bfeatured-image\b[^"']*["'][^>]*style=["']([^"']+)/i.exec(block)?.[1] || '',
			poster = absolute(/url\(\s*['"]?([^'"\s)]+)/i.exec(style)?.[1] || '', base),
			path = new URL(url).pathname;
		found.set(path, {
			id: `rrf:${encodeURIComponent(path)}`,
			name,
			type: 'movie',
			url,
			...(poster ? {
				poster
			} : {})
		});
	}
	return Array.from(found.values());
}

// Tanımlı katalog yolu ve sayfadan hedef adresi üretir.
function catalogUrl(base: string, path: string, page: number): string {
	if (!/^(?:page|category\/[a-z-]+\/page)$/.test(path)) throw Error('Geçersiz katalog yolu');
	return `${base}/${path}/${page}/`;
}

// rrf: içerik kimliğini güvenli ayrıntı sayfası adresine çözer.
function contentUrl(id: string, base: string): string | undefined {
	if (!id.startsWith('rrf:')) return undefined;
	try {
		const path = decodeURIComponent(id.slice(4));
		if (!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\/?$/i.test(path)) return undefined;
		const url = new URL(path, base);
		return sameHost(url.href, base) ? url.href : undefined;
	} catch {
		return undefined;
	}
}

// WordPress arama adresini sorgu metniyle kurar.
function searchUrl(base: string, query: string): string {
	return `${base}/?s=${encodeURIComponent(query)}`;
}

// Arama kartları içinden metadata başlığıyla tam eşleşenleri seçer.
function candidates(html: string, base: string, meta: Metadata): string[] {
	return catalogItems(html, base).filter(item => meta.titles.some(title => normalized(title) === normalized(item.name))).map(item => item.url);
}

// Ayrıntı sayfasındaki başlığın istenen içerikle aynı olduğunu denetler.
function matches(html: string, meta: Metadata): boolean {
	const title = text(/<h1\b[^>]*class=["'][^"']*\bentry-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || '');
	return !!title && meta.titles.some(item => normalized(item) === normalized(title));
}

// İçerik sayfasındaki gömülü oynatıcı bağlantısını alır.
function iframeUrl(html: string, base: string): string | undefined {
	const iframe = /<article\b[\s\S]*?<iframe\b([^>]*)>/i.exec(html)?.[1];
	return iframe ? absolute(attributes(iframe).src || '', base) : undefined;
}

// TMDB kimliğini aramada kullanılacak başlık bilgisine çevirir.
async function metadata(id: string): Promise < Metadata > {
	if (!/^\d+$/.test(id) || typeof TMDB_API_KEY !== 'string' || !TMDB_API_KEY) throw Error('Geçersiz medya kimliği');
	const data = JSON.parse((await siteRequest(`https://api.themoviedb.org/3/movie/${id}?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=en-US&append_to_response=external_ids`, '')).body);
	return {
		titles: [data.title, data.original_title].filter((value): value is string => typeof value === 'string' && !!value),
		year: parseInt(data.release_date) || undefined
	};
}

// Oynatıcı sayfasındaki kaçış karakterlerini JSON okumaya uygun hâle getirir.
function decodeEscapes(value: string): string {
	return value.replace(/(?:\\&quot;|&quot;)/g, '"').replace(/\\\\/g, '\\').replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}

// OK.ru oynatıcısından video, kalite, altyazı ve gerekli başlıkları çıkarır.
function okruStreams(html: string, pageUrl: string): {
	url: string;audio: string;format: StreamFormat;headers: Record < string,
	string > ;subtitles: Subtitle[]
} [] {
	const payload = decodeEscapes(html),
		videosRaw = /"videos"\s*:\s*(\[[\s\S]*?\])/i.exec(payload)?.[1],
		subtitlesRaw = /"subtitleTracks"\s*:\s*(\[[\s\S]*?\])/i.exec(payload)?.[1];
	if (!videosRaw) return [];
	let videos: OkRuVideo[] = [],
		tracks: OkRuSubtitle[] = [];
	try {
		videos = JSON.parse(videosRaw) as OkRuVideo[];
	} catch {
		return [];
	}
	try {
		tracks = subtitlesRaw ? JSON.parse(subtitlesRaw) as OkRuSubtitle[] : [];
	} catch {}
	const mediaHeaders = headers(new URL(pageUrl).origin + '/'),
		subtitles = tracks.flatMap(track => {
			const url = absolute(track.url || '', pageUrl);
			return url ? [{
				id: url,
				url,
				lang: track.language || 'Unknown',
				headers: mediaHeaders
			}] : [];
		}),
		result = new Map < string,
		{
			url: string;audio: string;format: StreamFormat;headers: Record < string,
			string > ;subtitles: Subtitle[]
		} > ();
	for (const video of videos) {
		const url = absolute(video.url || '', pageUrl);
		const quality = String(video.name || '').toLowerCase().replace('mobile', '144p').replace('lowest', '240p').replace('low', '360p').replace('sd', '480p').replace('hd', '720p').replace('full', '1080p').replace('quad', '1440p').replace('ultra', '4k');
		if (url && !result.has(url)) result.set(url, {
			url,
			audio: quality || 'Odnoklassniki',
			format: /\.mp4(?:[?#]|$)/i.test(url) ? 'mp4' : /\.mkv(?:[?#]|$)/i.test(url) ? 'mkv' : 'm3u8',
			headers: mediaHeaders,
			subtitles
		});
	}
	return Array.from(result.values());
}

// Çözülen medya kaynağını Nuvio akış kartı biçimine dönüştürür.
function createStream(source: {
	url: string;audio: string;format: StreamFormat;headers: Record < string,
	string > ;subtitles: Subtitle[]
}): Stream {
	const quality = '1080p';
	return {
		name: `${config.name} - ${source.audio || 'Dil belirtilmemiş'}`,
		title: 'manitux',
		description: `${quality} • ${source.format === 'm3u8' ? 'HLS' : source.format.toUpperCase()}`,
		quality,
		format: source.format,
		type: source.format,
		url: source.url,
		headers: source.headers,
		subtitles: source.subtitles
	};
}

interface CatalogRequest {
	catalogId ? : string;
	type ? : string;
	pageToken ? : string | null;
}
interface CatalogResponse {
	items: readonly CatalogItem[];nextPageToken ? : string;
}
interface SearchRequest {
	query ? : string;language ? : string;
}

function pageNumber(token: string | null | undefined): number | undefined {
	if (token == null || token === '') return 1;
	if (!/^\d+$/.test(token)) return undefined;
	const page = Number(token);
	return page >= 1 && page <= 100 ? page : undefined;
}

// İstenen rafın sayfasını indirip NuvioTR katalog yanıtına dönüştürür.
export async function getCatalog({
	catalogId,
	type,
	pageToken
}: CatalogRequest): Promise < CatalogResponse > {
	const catalog = catalogs.find(item => item.id === catalogId),
		page = pageNumber(pageToken);
	if (!catalog || type !== 'movie' || !page) return {
		items: []
	};
	try {
		const response = await siteRequest(catalogUrl(config.fallback, catalog.path, page), config.fallback + '/'),
			items = catalogItems(response.body, response.url);
		return {
			items,
			...(items.length ? {
				nextPageToken: String(page + 1)
			} : {})
		};
	} catch (error) {
		console.warn(`[${config.id}] Katalog:`, String(error));
		return {
			items: []
		};
	}
}

// WordPress aramasından doğrudan oynatılabilir katalog kartları döndürür.
export async function search({
	query
}: SearchRequest): Promise < {
	items: readonly CatalogItem[]
} > {
	const value = String(query || '').trim();
	if (!value) return {
		items: []
	};
	try {
		const response = await siteRequest(searchUrl(config.fallback, value), config.fallback + '/');
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

// Film kimliğinden ayrıntı ve oynatıcı sayfalarına ilerleyerek medya akışlarını çözer.
export async function getStreams(id: string, mediaType: string, season ? : number, episode ? : number): Promise < Stream[] > {
	if (!config.enabled || mediaType !== 'movie' || season !== undefined || episode !== undefined) return [];
	try {
		const direct = contentUrl(String(id), config.fallback),
			meta = direct ? undefined : await metadata(String(id));
		const search = direct ? undefined : await siteRequest(searchUrl(config.fallback, meta!.titles[0] || ''), config.fallback + '/');
		for (const candidate of (direct ? [direct] : candidates(search!.body, search!.url, meta!)).slice(0, 8)) {
			const detail = await siteRequest(candidate, search?.url || config.fallback + '/');
			if (meta && !matches(detail.body, meta)) continue;
			const iframe = iframeUrl(detail.body, detail.url);
			if (!iframe) continue;
			const player = await siteRequest(iframe, detail.url),
				streams = okruStreams(player.body, player.url).map(createStream);
			if (streams.length) return streams;
		}
	} catch (error) {
		console.warn(`[${config.id}] Akış:`, String(error));
	}
	return [];
}
