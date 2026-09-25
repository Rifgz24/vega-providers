import { Post, ProviderContext } from "../types";

const BASE_URL = "https://anichin.moe";

export const getPosts = async function ({
  filter,
  page,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    const { axios, cheerio } = providerContext;
    const url = `${BASE_URL}${filter}${page > 1 ? `page/${page}/` : ""}`;

    const res = await axios.get(url, {
      headers: { ...providerContext.commonHeaders, Referer: BASE_URL },
      signal,
    });

    const $ = cheerio.load(res.data);
    const posts: Post[] = [];

    $(".bixbox .listupd .bs").each((_, el) => {
      const title = $(el).find(".ttitle").text().trim();
      const href = $(el).find("a").attr("href") || "";
      const image = $(el).find("img").attr("src") || "";

      if (title && href) posts.push({ title, link: href, image });
    });

    return posts;
  } catch {
    return [];
  }
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    const { axios, cheerio } = providerContext;
    const url = `${BASE_URL}/?s=${encodeURIComponent(searchQuery)}`;

    const res = await axios.get(url, {
      headers: { ...providerContext.commonHeaders, Referer: BASE_URL },
      signal,
    });

    const $ = cheerio.load(res.data);
    const posts: Post[] = [];

    $(".bixbox .listupd .bs").each((_, el) => {
      const title = $(el).find(".ttitle").text().trim();
      const href = $(el).find("a").attr("href") || "";
      const image = $(el).find("img").attr("src") || "";

      if (title && href) posts.push({ title, link: href, image });
    });

    return posts;
  } catch {
    return [];
  }
};
