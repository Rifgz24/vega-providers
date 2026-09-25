import { Info, Link, ProviderContext } from "../types";
import { throwProviderError } from "../providerErrors";

const BASE_URL = "https://wetv.vip";

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
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
    });

    const $ = cheerio.load(res.data);
    
    const title = $(".video_title").text().trim() || 
                  $("h1.title").text().trim() ||
                  $(".detail_title").text().trim();

    const synopsis = $(".video_desc").text().trim() ||
                     $(".description").text().trim() || "";

    const image = $(".video_poster img").attr("src") ||
                  $(".poster img").attr("src") ||
                  $("meta[property='og:image']").attr("content") || "";

    const rating = $(".video_score").text().trim() ||
                   $(".rating").text().trim() || "";

    const cast: string[] = [];
    $(".actor_list .actor_name").each((_, el) => {
      const name = $(el).text().trim();
      if (name) cast.push(name);
    });

    const tags: string[] = [];
    $(".tag_list .tag").each((_, el) => {
      const tag = $(el).text().trim();
      if (tag) tags.push(tag);
    });

    // Build linkList for series
    const linkList: Link[] = [];
    const episodeLinks: { title: string; link: string }[] = [];

    $(".episode_list .episode_item").each((_, el) => {
      const epTitle = $(el).find(".episode_num").text().trim() || 
                      $(el).text().trim();
      let epLink = $(el).find("a").attr("href") || $(el).attr("href") || "";
      if (epLink && !epLink.startsWith("http")) {
        epLink = `${BASE_URL}${epLink.startsWith("/") ? "" : "/"}${epLink}`;
      }
      if (epTitle && epLink) {
        episodeLinks.push({ title: epTitle, link: epLink });
      }
    });

    // Fallback for different page structures
    if (episodeLinks.length === 0) {
      $("a[href*='/play/']").each((_, el) => {
        const epTitle = $(el).text().trim();
        let epLink = $(el).attr("href") || "";
        if (epLink && !epLink.startsWith("http")) {
          epLink = `${BASE_URL}${epLink.startsWith("/") ? "" : "/"}${epLink}`;
        }
        if (epTitle && epLink && epLink.includes("/play/")) {
          episodeLinks.push({ title: epTitle, link: epLink });
        }
      });
    }

    const type = episodeLinks.length > 1 ? "series" : "movie";

    if (episodeLinks.length > 0) {
      linkList.push({
        title: "Episodes",
        directLinks: episodeLinks.map(ep => ({
          title: ep.title,
          link: ep.link,
          type: "series" as const,
        })),
      });
    } else {
      linkList.push({
        title: "Play",
        quality: "1080p",
        directLinks: [{ title: "Play", link: watchUrl, type: "movie" }],
      });
    }

    return {
      title,
      image,
      synopsis,
      imdbId: "",
      type,
      rating,
      cast,
      tags,
      linkList,
    };
  } catch (err) {
    throwProviderError("wetv", "getMeta", err);
    throw err;
  }
};
