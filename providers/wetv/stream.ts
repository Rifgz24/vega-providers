import { Stream, ProviderContext } from "../types";
import { throwProviderError } from "../providerErrors";

const BASE_URL = "https://wetv.vip";

export const getStream = async function ({
  link,
  type,
  signal,
  providerContext,
  isDownload,
}: {
  link: string;
  type: string;
  signal?: AbortSignal;
  providerContext: ProviderContext;
  isDownload?: boolean;
}): Promise<Stream[]> {
  try {
    const { axios, cheerio } = providerContext;
    
    let watchUrl = link;
    if (!watchUrl.startsWith("http")) {
      watchUrl = `${BASE_URL}${watchUrl.startsWith("/") ? "" : "/"}${watchUrl}`;
    }

    const res = await axios.get(watchUrl, {
      headers: {
        ...providerContext.commonHeaders,
        Referer: BASE_URL,
      },
      signal,
    });

    const $ = cheerio.load(res.data);
    const streams: Stream[] = [];

    // Look for hls/m3u8 links in script tags or data attributes
    const scriptContent = $("script").html() || "";
    const m3u8Matches = scriptContent.match(/["']([^"']*.m3u8[^"']*)["']/g);
    
    if (m3u8Matches && m3u8Matches.length > 0) {
      m3u8Matches.forEach((m3u8, idx) => {
        const url = m3u8.replace(/['"]/g, "");
        streams.push({
          server: `Stream ${idx + 1}`,
          link: url,
          type: "hls",
          quality: "1080p",
        });
      });
    }

    // Fallback: look for video source tags
    const src = $("source[type='application/x-mpegURL'], source[type='application/hls+mpegurl'], source[type='application/vnd.apple.mpegurl']").attr("src");
    if (src) {
      streams.push({
        server: "Primary",
        link: src,
        type: "hls",
        quality: "1080p",
      });
    }

    // Try to find direct video URLs
    const videoSrc = $("video source").attr("src");
    if (videoSrc) {
      streams.push({
        server: "Direct",
        link: videoSrc,
        type: videoSrc.endsWith(".mp4") ? "mp4" : "hls",
        quality: "1080p",
      });
    }

    // Fallback: search for mp4/hls in text content
    if (streams.length === 0) {
      const textContent = $("body").text();
      const allMatches = [...textContent.matchAll(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)];
      allMatches.forEach((match, idx) => {
        streams.push({
          server: `Stream ${idx + 1}`,
          link: match[0],
          type: "hls",
          quality: "1080p",
        });
      });
    }

    if (streams.length === 0) {
      throw new Error("No video streams found");
    }

    return streams;
  } catch (err) {
    throwProviderError("wetv", "getStream", err);
    throw err;
  }
};
