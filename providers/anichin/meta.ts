import { Info, Link, ProviderContext } from "../types";
import { throwProviderError } from "../providerErrors";

const BASE_URL = "https://anichin.moe";

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  try {
    const { axios, cheerio } = providerContext;

    const res = await axios.get(link, {
      headers: { ...providerContext.commonHeaders, Referer: BASE_URL },
    });

    const $ = cheerio.load(res.data);
    const title = $(".entry-title").text().trim();
    const synopsis = $(".entry-content p").text().trim();
    const image = $(".thumb img").attr("src") || "";
    const rating = $(".rating").text().trim();

    const episodeLinks: { title: string; link: string }[] = [];
    $(".episodelist ul li").each((_, el) => {
      const epTitle = $(el).find(".chapternum").text().trim();
      const epLink = $(el).find("a").attr("href") || "";
      if (epTitle && epLink) episodeLinks.push({ title: epTitle, link: epLink });
    });

    const linkList: Link[] = [];
    if (episodeLinks.length > 0) {
      linkList.push({
        title: "Episodes",
        directLinks: episodeLinks.map((ep) => ({
          title: ep.title,
          link: ep.link,
          type: "series" as const,
        })),
      });
    } else {
      linkList.push({
        title: "Watch",
        quality: "1080p",
        directLinks: [{ title: "Watch", link, type: "movie" }],
      });
    }

    return {
      title,
      image,
      synopsis,
      imdbId: "",
      type: episodeLinks.length > 0 ? "series" : "movie",
      rating,
      linkList,
    };
  } catch (err) {
    throwProviderError("anichin", "getMeta", err);
    throw err;
  }
};
