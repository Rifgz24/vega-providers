import { Stream, ProviderContext } from "../types";
import { throwProviderError } from "../providerErrors";

export const getStream = async function ({
  link,
  providerContext,
}: {
  link: string;
  type: string;
  signal?: AbortSignal;
  providerContext: ProviderContext;
  isDownload?: boolean;
}): Promise<Stream[]> {
  try {
    const { axios, cheerio } = providerContext;

    const res = await axios.get(link, {
      headers: { ...providerContext.commonHeaders },
    });

    const $ = cheerio.load(res.data);
    const streams: Stream[] = [];

    // Find iframe sources
    $("iframe").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        streams.push({
          server: "Embed",
          link: src.startsWith("//") ? `https:${src}` : src,
          type: "embed",
        });
      }
    });

    // Check script tag for m3u8
    const scriptContent = $("script").html() || "";
    const m3u8Matches = scriptContent.match(/["']([^"']*\.m3u8[^"']*)["']/g);
    if (m3u8Matches) {
      m3u8Matches.forEach((m, idx) => {
        streams.push({
          server: `Stream ${idx + 1}`,
          link: m.replace(/['"]/g, ""),
          type: "hls",
        });
      });
    }

    if (streams.length === 0) throw new Error("No streams found");

    return streams;
  } catch (err) {
    throwProviderError("anichin", "getStream", err);
    throw err;
  }
};
