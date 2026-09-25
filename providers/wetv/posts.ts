import { Post, ProviderContext } from "../types";

const BASE_URL = "https://wetv.vip";

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
    const url = `${BASE_URL}${filter}&page=${page}`;

    const res = await axios.get(url, {
      headers: {
        ...providerContext.commonHeaders,
        Referer: BASE_URL,
      },
      signal,
    });

    const $ = cheerio.load(res.data);
    const posts: Post[] = [];

    $(".list_item").each((_, el) => {
      const title = $(el).find(".figure_title").text().trim() || 
                    $(el).find(".figure_title a").text().trim();
      const linkEl = $(el).find(".figure_title a");
      let href = linkEl.attr("href") || "";
      if (!href) return;
      
      if (!href.startsWith("http")) {
        href = `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
      }

      const image = $(el).find(".figure_pic img").attr("src") || 
                    $(el).find("img").attr("src") || "";

      if (title && href) {
        posts.push({
          title,
          link: href,
          image,
        });
      }
    });

    // Fallback: if list_item not found, try common patterns
    if (posts.length === 0) {
      $("a[href*='/play/']").each((_, el) => {
        const title = $(el).find(".title, .name").text().trim() || 
                      $(el).attr("title") || 
                      "";
        let href = $(el).attr("href") || "";
        if (!href) return;
        
        if (!href.startsWith("http")) {
          href = `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
        }

        const image = $(el).find("img").attr("src") || "";
        
        if (title && href) {
          posts.push({
            title,
            link: href,
            image,
          });
        }
      });
    }

    return posts;
  } catch (err) {
    console.error("WeTV getPosts error:", err);
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
    const url = `${BASE_URL}/search?query=${encodeURIComponent(searchQuery)}&page=${page}`;

    const res = await axios.get(url, {
      headers: {
        ...providerContext.commonHeaders,
        Referer: BASE_URL,
      },
      signal,
    });

    const $ = cheerio.load(res.data);
    const posts: Post[] = [];

    $(".search_result_item").each((_, el) => {
      const title = $(el).find(".result_title").text().trim();
      let href = $(el).find("a").attr("href") || "";
      if (!href) return;
      
      if (!href.startsWith("http")) {
        href = `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
      }

      const image = $(el).find("img").attr("src") || "";

      if (title && href) {
        posts.push({
          title,
          link: href,
          image,
        });
      }
    });

    return posts;
  } catch (err) {
    console.error("WeTV getSearchPosts error:", err);
    return [];
  }
};
