import axios from "axios";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import moment from "moment";
import Parser from "rss-parser";
// @ts-ignore: If you see a type error for date-fns, run 'npm install date-fns'
import { format } from "date-fns";
import type { Cheerio, CheerioAPI } from "cheerio";
import { create } from "domain";
import https from "https";
import puppeteer from "puppeteer"
import { title } from "process";

// Helper function to create a news object
function createNewsItem(
  headline: string,
  url: string,
  source: string,
  category: string,
  description = "",
  image = ""
) {
  if (!headline || !url) return null;
  return {
    headline,
    description: description || headline,
    author: source,
    time: new Date().toISOString(),
    image,
    category,
    source,
    url,
  };
}


function getFinanceCategory(text: string) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("stocks")) return "stocks";
  if (lower.includes("nifty")) return "nifty";
  if (lower.includes("sensex")) return "sensex";
  if (lower.includes("ipo")) return "ipo";
  if (lower.includes("dividend")) return "dividend";
  if (lower.includes("market")) return "market";
  if (lower.includes("investment")) return "investment";
  if (lower.includes("mutual fund")) return "mutual fund";
  if (lower.includes("commodity")) return "commodity";
  if (lower.includes("futures")) return "futures";
  if (lower.includes("options")) return "options";
  if (lower.includes("bond")) return "bond";
  if (lower.includes("interest rate")) return "interest rate";
  if (lower.includes("inflation")) return "inflation";
  if (lower.includes("banknifty")) return "banknifty";
  if (lower.includes("bank")) return "bank";
  if (lower.includes("share market")) return "share market";
  if (lower.includes("sebi")) return "sebi";
  if (lower.includes("rbi")) return "rbi";
  if (lower.includes("fintech")) return "fintech";
  if (lower.includes("startup")) return "startup";
  if (lower.includes("business")) return "business";
  if (lower.includes("economy")) return "economy";
  if (lower.includes("gdp")) return "gdp";
  if (lower.includes("recession")) return "recession";
  if (lower.includes("fiscal")) return "fiscal";
  if (lower.includes("revenue")) return "revenue";
  if (lower.includes("profit")) return "profit";
  if (lower.includes("merger")) return "merger";
  if (lower.includes("acquisition")) return "acquisition";
  if (lower.includes("funding")) return "funding";
  if (lower.includes("valuation")) return "valuation";
  if (lower.includes("finance")) return "finance";
  if (lower.includes("fii")) return "fii";
  if (lower.includes("dii")) return "dii";
  if (lower.includes("gst")) return "gst";
  if (lower.includes("rbi policy")) return "rbi policy";
  if (lower.includes("monetary policy")) return "monetary policy";
  if (lower.includes("rupee")) return "rupee";
  if (lower.includes("dollar")) return "dollar";
  if (lower.includes("forex")) return "forex";
  if (lower.includes("trade")) return "trade";
  if (lower.includes("budget")) return "budget";
  if (lower.includes("taxation")) return "taxation";
  if (lower.includes("corporate")) return "corporate";
  if (lower.includes("msme")) return "msme";
  if (lower.includes("nbfc")) return "nbfc";
  if (lower.includes("insurance")) return "insurance";
  if (lower.includes("infrastructure")) return "infrastructure";
  if (lower.includes("disinvestment")) return "disinvestment";
  if (lower.includes("psu")) return "psu";
  return null;
}
function getZone(text: string) {
  if (!text) return "world";
  const lower = text.toLowerCase();
  if (
    lower.includes("india") ||
    lower.includes("nifty") ||
    lower.includes("sensex") ||
    lower.includes("bse") ||
    lower.includes("nse") ||
    lower.includes("rupee") ||
    lower.includes("rbi")
  )
    return "india";
  return "world";
}

// Helper to get today's date in YYYY-MM-DD
function getTodayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

const scrapeTimesOfIndia2 = async () => {
  try {
    // Configure HTTPS agent with modern TLS settings
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporary workaround for SSL issues (not recommended for production)
      secureOptions:
        require("crypto").constants.SSL_OP_NO_SSLv2 |
        require("crypto").constants.SSL_OP_NO_SSLv3 |
        require("crypto").constants.SSL_OP_NO_TLSv1 |
        require("crypto").constants.SSL_OP_NO_TLSv1_1, // Enforce TLS 1.2 or higher
    });

    // Make HTTP request with updated headers and agent
    const response = await axios.get(
      "https://timesofindia.indiatimes.com/briefs",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        httpsAgent: agent,
        timeout: 30000, // 30-second timeout
      }
    );

    console.log("Successfully fetched Times of India page");

    const $: CheerioAPI = cheerio.load(response.data);
    const today = moment().format("YYYY-MM-DD HH:mm:ss");

    const news: any[] = [];
    // Updated selector based on Times of India structure (adjust if needed)
    const wrapper = $(".brief_box"); // Adjust selector to match actual DOM structure
    for (const element of wrapper.toArray()) {
      const $el = $(element);
      const title =
        $el.find("h2").first().text().trim() ||
        $el.find("h1").first().text().trim();
      const description = $el.find("p").first().text().trim();
      const a = $el.find("a").first();
      const href = a.attr("href");
      const url = href
        ? href.startsWith("http")
          ? href
          : `https://timesofindia.indiatimes.com${href}`
        : "";

      // Apply finance category and zone filters
      const category =
        getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) continue; // Skip non-finance-related news
      const zone = getZone(title + " " + description);

      news.push({
        title,
        description,
        url,
        time: today,
        image: "",
        author: "Times of India",
        category,
        zone,
        source: "timesofindia",
      });
    }

    // console.log("TImes of India scraped news:", news);
    return news;
  } catch (error: any) {
    console.error("Cheerio Times of India Error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape Times of India: ${error.message}`);
  }
};

const scrapeCNBC2 = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--window-size=1920,1080',
        '--start-maximized',
      ],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
    });

    await page.goto('https://www.cnbc.com/world/?region=world', { waitUntil: 'networkidle2' });

    const selector = '.RiverPlus-riverPlusContainer .RiverPlusCard-container';
    const tableExists = await page.evaluate((sel) => {
      return document.querySelector(sel) !== null;
    }, selector);

    if (!tableExists) {
      await browser.close();
      throw new Error('No articles found with the specified selector');
    }

    await page.waitForSelector(selector, { timeout: 10000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');
    const articles:any = [];

    $(selector).each((index, element) => {
      const $el = $(element);
      const title = $el.find('.RiverHeadline-headline').text().trim();
      const href = $el.find('.RiverHeadline-headline a').attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `https://www.cnbc.com${href}`
        : '';
      const time = $el.find('.RiverByline-datePublished').text().trim() || today;
      const author = $el.find('.RiverByline-authorByline a').text().trim() || 'CNBC';
      const image = $el.find('.RiverThumbnail-imageThumbnail img').attr('src') || '';
      const category = getFinanceCategory(title);
      const zone = getZone(title) || 'Global';
      
      if (title && url && category) {
        articles.push({ title, url, time, author, image, category, zone });
      }
    });

    const news = [];
    for (const article of articles) {
      try {
        const articlePage = await browser.newPage();
        await articlePage.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );
        await articlePage.setExtraHTTPHeaders({
          'accept-language': 'en-US,en;q=0.9',
        });
        await articlePage.goto(article.url, { waitUntil: 'networkidle2' });
        await articlePage.waitForSelector('.ArticleBody-articleBody .group', { timeout: 10000 }).catch(() => {
          console.warn(`Article body not found for ${article.url}, skipping content extraction`);
        });

        const articleHtml = await articlePage.content();
        const $article = cheerio.load(articleHtml);

        let description = '';
        const articleBody = $article('.ArticleBody-articleBody .group');

        if (articleBody.length) {
          description = articleBody
            .find('p')
            .map((i, el) => $article(el).text().trim())
            .get()
            .join(' ');
        }

        let keyPoints = '';
        const keyPointsList = $article('.RenderKeyPoints-list li');
        if (keyPointsList.length) {
          keyPoints = keyPointsList
            .map((i, el) => $article(el).text().trim())
            .get()
            .join('; ');
        }

        news.push({
          title: article.title,
          description: description || keyPoints || title,
          url: article.url,
          time: article.time,
          image: article.image,
          author: article.author,
          category: article.category,
          zone: article.zone,
          source: 'cnbc',
        });

        await articlePage.close();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error:any) {
        console.error(`Failed to scrape article at ${article.url}: ${error.message}`);
        news.push({
          title: article.title,
          description: 'Failed to retrieve article content',
          url: article.url,
          time: article.time,
          image: article.image,
          author: article.author,
          category: article.category,
          zone: article.zone,
          source: 'cnbc',
        });
      }
    }

    await browser.close();
    // console.log('CNBC Scraped news:', news);
    return news;
  } catch (error:any) {
    console.error('Cheerio CNBC Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape CNBC News: ${error.message}`);
  }
};

const scrapeLiveMintWorld2 = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--window-size=1920,1080',
        '--start-maximized',
      ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
    });

    await page.goto('https://www.livemint.com/news/world', { waitUntil: 'networkidle2', timeout: 30000 });

    const selector = '#mylistView #listview';
    const tableExists = await page.evaluate((sel) => {
      return document.querySelector(sel) !== null;
    }, selector);

    if (!tableExists) {
      console.error('No articles found with the specified selector');
    }

    await page.waitForSelector(selector, { timeout: 15000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');
    const articles:any = [];

    // Extract articles from listing
    $('.listtostory').each((index, element) => {
      const $el = $(element);
      const title = $el.find('.headline a').text().trim();
      const href = $el.find('.headline a').attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `https://www.livemint.com${href}`
        : '';
      const timeText = $el.find('.date span[data-expandedtime]').attr('data-expandedtime') || today;
      const time = timeText.includes('Updated:') 
        ? moment(timeText.replace('Updated: ', ''), 'DD MMM YYYY, hh:mm A').format('YYYY-MM-DD HH:mm:ss')
        : today;
      const image = $el.find('.thumbnail img').attr('src') || '';
      const isPremium = $el.find('.thumbnail .exclusive').length > 0;
      const category = getFinanceCategory(title);
      const zone = 'Global';
      if (title && url && category) {
        articles.push({ title, url, time, image, isPremium, category, zone });
      }
    });

    const news = [];

    for (const article of articles) {
      let articlePage;
      try {
        articlePage = await browser.newPage();
        await articlePage.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );
        await articlePage.setExtraHTTPHeaders({
          'accept-language': 'en-US,en;q=0.9',
        });
        await articlePage.goto(article.url, { waitUntil: 'networkidle2', timeout: 30000 });

        await articlePage.waitForSelector('.storyPage_storyBox__9iWpG .storyPage_storyContent__3xuFc', { timeout: 15000 }).catch(() => {
          console.warn(`Article body not found for ${article.url}, skipping content extraction`);
        });

        const articleHtml = await articlePage.content();
        const $article = cheerio.load(articleHtml);

        let description = '';
        const articleBody = $article('.storyParagraph p');

        if (articleBody.length) {
          description = articleBody
            .map((i, el) => $article(el).text().trim())
            .get()
            .join(' ');
        }

        news.push({
          title: article.title,
          description: description || article.title,
          url: article.url,
          time: article.time,
          image: article.image,
          isPremium: article.isPremium,
          author: $article('.storyBy span').text().trim() || 'LiveMint',
          category: article.category,
          zone: article.zone,
          source: 'live mint world',
        });
      } catch (error:any) {
        console.error(`Failed to scrape article at ${article.url}: ${error.message}`);
        news.push({
          title: article.title,
          description: 'Failed to retrieve article content',
          url: article.url,
          time: article.time,
          image: article.image,
          isPremium: article.isPremium,
          author: 'LiveMint',
          category: article.category,
          zone: article.zone,
          source: 'livemint',
        });
      } finally {
        if (articlePage) await articlePage.close();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // console.log('Live mint scraped news:', news);
    return news;
  } catch (error:any) {
    console.error('Cheerio LiveMint Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape LiveMint News: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
};

// Helper to extract title (h1-h6) and description (p) from a cheerio element
function extractTitleAndDescription($element: cheerio.Cheerio<any>) {
  let title = "";
  let description = "";

  // Title: h1 > h2 > a (strict order, first found, never p/span)
  const h1 = $element.find("h1").first();
  if (h1.length && h1.text().trim()) {
    title = h1.text().trim();
  } else {
    const h2 = $element.find("h2").first();
    if (h2.length && h2.text().trim()) {
      title = h2.text().trim();
    } else {
      const a = $element.find("a").first();
      if (a.length && a.text().trim()) {
        title = a.text().trim();
      }
    }
  }

  // Description: first p, else first span (never h2)
  const p = $element.find("p").first();
  if (p.length && p.text().trim()) {
    description = p.text().trim();
  } else {
    const span = $element.find("span").first();
    if (span.length && span.text().trim()) {
      description = span.text().trim();
    }
  }

  return { title, description };
}

// Times of India
export async function scrapeTimesOfIndia() {
  const news = await scrapeTimesOfIndia2();
  return news;
}

// CNBC
export async function scrapeCNBC() {
  const news = await scrapeCNBC2();
  return news;
}

// Moneycontrol
export async function scrapeMoneycontrol() {
  // const url = 'https://www.moneycontrol.com/news/business/';
  // const { data } = await axios.get(url, {
  //   headers: {
  //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  //   }
  // });
  // const $ = cheerio.load(data);
  // const news: any[] = [];
  // $('ul#category li').each((i, el) => {
  //   const $el = $(el);
  //   const { title, description } = extractTitleAndDescription($el);
  //   if (title && description) {
  //     const a = $el.find('a').first();
  //     let link = '';
  //     if (a.length) {
  //       const href = a.attr('href') || '';
  //       link = href.startsWith('http') ? href : 'https://www.moneycontrol.com' + href;
  //     }
  //     const category = getFinanceCategory(title) || getFinanceCategory(description);
  //     if (!category) return; // skip if not stock market related
  //     const zone = getZone(title + ' ' + description);
  //     news.push({
  //       title,
  //       description,
  //       author: 'Moneycontrol',
  //       time: new Date().toISOString(),
  //       image: '',
  //       category,
  //       zone,
  //       source: 'moneycontrol',
  //       url: link,
  //     });
  //   }
  // });
  // return news;


  try {
    // Configure HTTPS agent with modern TLS settings
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporary workaround for SSL issues (not recommended for production)
      secureOptions: require('crypto').constants.SSL_OP_NO_SSLv2 |
                     require('crypto').constants.SSL_OP_NO_SSLv3 |
                     require('crypto').constants.SSL_OP_NO_TLSv1 |
                     require('crypto').constants.SSL_OP_NO_TLSv1_1, // Enforce TLS 1.2 or higher
    });

    // Make HTTP request with updated headers and agent
    const response = await axios.get('https://www.moneycontrol.com/news/business/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      httpsAgent: agent,
      timeout: 30000, // 30-second timeout
    });

 

    const $: CheerioAPI = cheerio.load(response.data);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');

    const news: any[] = [];
    // Updated selector based on Times of India structure (adjust if needed)
    const wrapper = $('.mid-contener #left #cagetory .clearfix'); // Adjust selector to match actual DOM structure

    for (const element of wrapper.toArray()) {
      const $el = $(element);
      const title = $el.find('h2').first().text().trim() || $el.find('h1').first().text().trim();
      const description = $el.find('p').first().text().trim();
      const a = $el.find('a').first();
      const href = a.attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `moneycontrol.com/news/business/ipo${href}`
        : '';

      // Apply finance category and zone filters
      const category = getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) continue; // Skip non-finance-related news
      const zone = getZone(title + ' ' + description);

      news.push({
        title,
        description,
        url,
        time: today,
        image: '',
        author: 'Money control',
        category,
        zone,
        source: 'moneyControl',   
      });
    }


    return news;
  } catch (error:any) {
    console.error('Cheerio Times of India Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape Times of India: ${error.message}`);
  }



}

// RSS Feeds
export async function scrapeRssFeeds() {
  const parser = new Parser();
  const rssFeeds = [
    // Finance / Business

    "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
    "https://www.financialexpress.com/feed/",
    "https://www.livemint.com/rss",
    "https://www.business-standard.com/rss/home_page_top_stories.rss",

    // National / General India News
    "https://feeds.feedburner.com/ndtvnews-top-stories",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    "https://www.hindustantimes.com/rss/topnews/rssfeed.xml",
    "https://indianexpress.com/feed/",
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "https://www.news18.com/rss/india.xml",
    // Global News
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.reuters.com/tools/rss",
  ];
  const allFeeds: any[] = [];
  const placeholders = [
    "stock",
    "nifty",
    "growth",
    "sensex",
    "shares",
    "bse",
    "nse",
    "ipo",
    "dividend",
    "market",
    "investment",
    "mutual fund",
    "commodity",
    "futures",
    "options",
    "bond",
    "banknifty",
    "bank",
    "share",
    "sebi",
    "rbi",
    "fii",
    "dii",
    "gst",
    "rbi policy",
    "monetary policy",
    "rupee",
    "dollar",
    "forex",
    "export",
    "import",
    "trade",
    "budget",
    "taxation",
    "corporate",
    "msme",
    "nbfc",
    "insurance",
    "pension",
    "infrastructure",
    "disinvestment",
    "psu",
    "business",
    "economy",
    "finance",
    "startup",
    "valuation",
    "funding",
    "merger",
    "acquisition",
    "profit",
    "loss",
    "revenue",
    "gdp",
    "recession",
    "fiscal",
    "india",
    "world",
  ];
  for (const url of rssFeeds) {
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items
        .map((item) => {
          const headline = item.title || "";
          const url = item.link || "";
          const description =
            item.contentSnippet || item.content || item.summary || "";
          const source = feed.title || "";
          const time = item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString();
          const cat =
            getFinanceCategory(headline) ||
            getFinanceCategory(description) ||
            "General";
          const topic =
            placeholders[Math.floor(Math.random() * placeholders.length)];

          return {
            headline,
            description,
            author: source.trim(),
            time,

            category: cat.charAt(0).toUpperCase() + cat.slice(1),
            source: source.trim(),
            url,
          };
        })
        .filter(Boolean);
      allFeeds.push(...items);
    } catch (err: any) {
      console.error(`Error parsing ${url}`, err.message);
    }
  }
  return allFeeds;
}

// LiveMint Latest News Scraper
export async function scrapeLivemintNews() {
  const url = "https://www.livemint.com/latest-news";
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $("li").each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find("a").first();
      let link = "";
      if (a.length) {
        const href = a.attr("href") || "";
        link = href.startsWith("http")
          ? href
          : "https://www.livemint.com" + href;
      }
      const category =
        getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) return; // skip if not stock market related
      const zone = getZone(title + " " + description);
      news.push({
        title,
        description,
        url: link,
        category,
        zone,
        source: "",
        date: today,
      });
    }
  });
  return news;
}

// Economic Times Markets/Stocks News Scraper
export async function scrapeEconomicTimesNews() {
  const url = "https://economictimes.indiatimes.com/markets/stocks/news";
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $('li[data-section="Markets"]').each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find("a").first();
      let link = "";
      if (a.length) {
        const href = a.attr("href") || "";
        link = href.startsWith("http")
          ? href
          : "https://economictimes.indiatimes.com" + href;
      }
      const category =
        getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) return; // skip if not stock market related
      const zone = getZone(title + " " + description);
      news.push({
        title,
        description,
        url: link,
        category,
        zone,
        source: "",
        date: today,
      });
    }
  });
  return news;
}

// News18 Business News Scraper
export async function scrapeNews18News() {
  const url = "https://www.news18.com/business/";
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $("li").each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find("a").first();
      let link = "";
      if (a.length) {
        const href = a.attr("href") || "";
        link = href.startsWith("http") ? href : "https://www.news18.com" + href;
      }
      const category =
        getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) return; // skip if not stock market related
      const zone = getZone(title + " " + description);
      news.push({
        title,
        description,
        url: link,
        category,
        zone,
        source: "",
        date: today,
      });
    }
  });
  return news;
}

// Moneycontrol Economy News Scraper
export async function scrapeMoneycontrolEconomy() {
  // const url = 'https://www.moneycontrol.com/news/business/economy/';
  // const { data } = await axios.get(url, {
  //   headers: {
  //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  //   }
  // });
  // const $ = cheerio.load(data);
  // const today = getTodayDate();
  // const news: any[] = [];
  // $('li').each((i, el) => {
  //   const $el = $(el);
  //   const { title, description } = extractTitleAndDescription($el);
  //   if (title && description) {
  //     const a = $el.find('a').first();
  //     let link = '';
  //     if (a.length) {
  //       const href = a.attr('href') || '';
  //       link = href.startsWith('http') ? href : 'https://www.moneycontrol.com' + href;
  //     }
  //     const category = getFinanceCategory(title) || getFinanceCategory(description);
  //     if (!category) return; // skip if not stock market related
  //     const zone = getZone(title + ' ' + description);
  //     news.push({
  //       title,
  //       description,
  //       url: link,
  //       category,
  //       zone,
  //       source: '',
  //       date: today
  //     });
  //   }
  // });
  // return news;

  try {
    // Configure HTTPS agent with modern TLS settings
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporary workaround for SSL issues (not recommended for production)
      secureOptions: require('crypto').constants.SSL_OP_NO_SSLv2 |
                     require('crypto').constants.SSL_OP_NO_SSLv3 |
                     require('crypto').constants.SSL_OP_NO_TLSv1 |
                     require('crypto').constants.SSL_OP_NO_TLSv1_1, // Enforce TLS 1.2 or higher
    });

    // Make HTTP request with updated headers and agent
    const response = await axios.get('https://www.moneycontrol.com/news/business/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      httpsAgent: agent,
      timeout: 30000, // 30-second timeout
    });


    const $: CheerioAPI = cheerio.load(response.data);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');

    const news: any[] = [];
    // Updated selector based on Times of India structure (adjust if needed)
    const wrapper = $('.mid-contener #left #cagetory .clearfix'); // Adjust selector to match actual DOM structure

 
    for (const element of wrapper.toArray()) {
      const $el = $(element);
      const title = $el.find('h2').first().text().trim() || $el.find('h1').first().text().trim();
      const description = $el.find('p').first().text().trim();
      const a = $el.find('a').first();
      const href = a.attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `moneycontrol.com/news/business/ipo${href}`
        : '';

      // Apply finance category and zone filters
      const category = getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) continue; // Skip non-finance-related news
      const zone = getZone(title + ' ' + description);

      news.push({
        title,
        description,
        url,
        time: today,
        image: '',
        author: 'Money control Economics',
        category,
        zone,
        source: 'moneyControlEconomics',   
      });
    }

    return news;
  } catch (error:any) {
    console.error('Cheerio Times of India Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape Times of India: ${error.message}`);
  }
}

// India Today World/Business News Scraper
export async function scrapeIndiaTodayWorldNews() {
  // const url = 'https://www.indiatoday.in/business';
  // const { data } = await axios.get(url, {
  //   headers: { 'User-Agent': 'Mozilla/5.0' }
  // });
  // const $ = cheerio.load(data);
  // const today = getTodayDate();
  // const news: any[] = [];
  // const articles = $(".story__grid article").slice(0, 10);
  // articles.each((i, article) => {
  //   const $el = $(article);
  //   const { title, description } = extractTitleAndDescription($el);
  //   if (title && description) {
  //     const titleTag = $el.find('h2 a');
  //     let link = '';
  //     if (titleTag.length) {
  //       link = 'https://www.indiatoday.in' + titleTag.attr('href');
  //     }
  //     const category = getFinanceCategory(title) || getFinanceCategory(description);
  //     if (!category) return; // skip if not stock market related
  //     const zone = getZone(title + ' ' + description);
  //     news.push({
  //       title,
  //       description,
  //       url: link,
  //       category,
  //       zone,
  //       source: '',
  //       date: today
  //     });
  //   }
  // });
  // return news;

  try {
    // Configure HTTPS agent with modern TLS settings
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporary workaround for SSL issues (not recommended for production)
      secureOptions: require('crypto').constants.SSL_OP_NO_SSLv2 |
                     require('crypto').constants.SSL_OP_NO_SSLv3 |
                     require('crypto').constants.SSL_OP_NO_TLSv1 |
                     require('crypto').constants.SSL_OP_NO_TLSv1_1, // Enforce TLS 1.2 or higher
    });

    // Make HTTP request with updated headers and agent
    const response = await axios.get('https://www.indiatoday.in/business', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      httpsAgent: agent,
      timeout: 30000, // 30-second timeout
    });



    const $: CheerioAPI = cheerio.load(response.data);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');

    const news: any[] = [];
    // Updated selector based on Times of India structure (adjust if needed)
    const wrapper = $('.main__content .lhs__section .B1S3_B1__s3__widget__lSl3T .story__grid .B1S3_story__card__A_fhi '); // Adjust selector to match actual DOM structure


    for (const element of wrapper.toArray()) {
      const $el = $(element);
      const title = $el.find('h2').first().text().trim() || $el.find('h1').first().text().trim();
      const description = $el.find('p').first().text().trim();
      const a = $el.find('a').first();
      const href = a.attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `https://www.indiatoday.in/business${href}`
        : '';

      // Apply finance category and zone filters
      const category = getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) continue; // Skip non-finance-related news
      const zone = getZone(title + ' ' + description);

      news.push({
        title,
        description,
        url,
        time: today,
        image: '',
        author: 'India Today News',
        category,
        zone,
        source: 'indiaTodayNews',   
      });
    }


    return news;
  } catch (error:any) {
    console.error('Cheerio Times of India Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape Times of India: ${error.message}`);
  }



}




// LiveMint World News Scraper
export async function scrapeLivemintWorldNews() {
  const news = await scrapeLiveMintWorld2();
  return news;
}

// Moneycontrol World News Scraper
export async function scrapeMoneycontrolWorldNews() {
  // const url = 'https://www.moneycontrol.com/world/news/';
  // const { data } = await axios.get(url, {
  //   headers: { 'User-Agent': 'Mozilla/5.0' }
  // });
  // const $ = cheerio.load(data);
  // const today = getTodayDate();
  // const news: any[] = [];
  // const articles = $('ul#cagetory li').slice(0, 10);
  // articles.each((i, article) => {
  //   const $el = $(article);
  //   const { title, description } = extractTitleAndDescription($el);
  //   if (title && description) {
  //     const a = $el.find('a').first();
  //     let link = '';
  //     if (a.length) {
  //       const href = a.attr('href') || '';
  //       link = href.startsWith('http') ? href : 'https://www.moneycontrol.com' + href;
  //     }
  //     const category = getFinanceCategory(title) || getFinanceCategory(description);
  //     if (!category) return; // skip if not stock market related
  //     const zone = getZone(title + ' ' + description);
  //     news.push({
  //       title,
  //       description,
  //       url: link,
  //       category,
  //       zone,
  //       source: '',
  //       date: today
  //     });
  //   }
  // });
  // return news;




  try {
    // Configure HTTPS agent with modern TLS settings
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporary workaround for SSL issues (not recommended for production)
      secureOptions: require('crypto').constants.SSL_OP_NO_SSLv2 |
                     require('crypto').constants.SSL_OP_NO_SSLv3 |
                     require('crypto').constants.SSL_OP_NO_TLSv1 |
                     require('crypto').constants.SSL_OP_NO_TLSv1_1, // Enforce TLS 1.2 or higher
    });

    // Make HTTP request with updated headers and agent
    const response = await axios.get('https://www.moneycontrol.com/news/business/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      httpsAgent: agent,
      timeout: 30000, // 30-second timeout
    });

 

    const $: CheerioAPI = cheerio.load(response.data);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');

    const news: any[] = [];
    // Updated selector based on Times of India structure (adjust if needed)
    const wrapper = $('.mid-contener #left #cagetory .clearfix'); // Adjust selector to match actual DOM structure


    for (const element of wrapper.toArray()) {
      const $el = $(element);
      const title = $el.find('h2').first().text().trim() || $el.find('h1').first().text().trim();
      const description = $el.find('p').first().text().trim();
      const a = $el.find('a').first();
      const href = a.attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `moneycontrol.com/news/business/ipo${href}`
        : '';

      // Apply finance category and zone filters
      const category = getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) continue; // Skip non-finance-related news
      const zone = getZone(title + ' ' + description);

      news.push({
        title,
        description,
        url,
        time: today,
        image: '',
        author: 'Money control World',
        category,
        zone,
        source: 'moneyControlworld',   
      });
    }


    return news;
  } catch (error:any) {
    console.error('Cheerio Times of India Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape Times of India: ${error.message}`);
  }







}

// Economic Times International News Scraper
export async function scrapeEconomicTimesWorldNews() {
  // const url = 'https://economictimes.indiatimes.com/news/india';
  // const { data } = await axios.get(url, {
  //   headers: { 'User-Agent': 'Mozilla/5.0' }
  // });
  // const $ = cheerio.load(data);
  // const today = getTodayDate();
  // const news: any[] = [];
  // const articles = $('.top-news ul.list1 li').slice(0, 10);
  // articles.each((i, article) => {
  //   const $el = $(article);
  //   const { title, description } = extractTitleAndDescription($el);
  //   if (title && description) {
  //     const a = $el.find('a').first();
  //     let link = '';
  //     if (a.length) {
  //       const href = a.attr('href') || '';
  //       link = href.startsWith('/') ? 'https://economictimes.indiatimes.com' + href : href;
  //     }
  //     const category = getFinanceCategory(title) || getFinanceCategory(description);
  //     if (!category) return; // skip if not stock market related
  //     const zone = getZone(title + ' ' + description);
  //     news.push({
  //       title,
  //       description,
  //       url: link,
  //       category,
  //       zone,
  //       source: '',
  //       date: today
  //     });
  //   }
  // });
  // return news;

  try {
    // Configure HTTPS agent with modern TLS settings
    const agent = new https.Agent({
      rejectUnauthorized: false, // Temporary workaround for SSL issues (not recommended for production)
      secureOptions: require('crypto').constants.SSL_OP_NO_SSLv2 |
                     require('crypto').constants.SSL_OP_NO_SSLv3 |
                     require('crypto').constants.SSL_OP_NO_TLSv1 |
                     require('crypto').constants.SSL_OP_NO_TLSv1_1, // Enforce TLS 1.2 or higher
    });

    // Make HTTP request with updated headers and agent
    const response = await axios.get('https://economictimes.indiatimes.com/news/india', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      httpsAgent: agent,
      timeout: 30000, // 30-second timeout
    });



    const $: CheerioAPI = cheerio.load(response.data);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');

    const news: any[] = [];
    // Updated selector based on Times of India structure (adjust if needed)
    const wrapper = $('.main_container .section_list .tabdata .eachStory'); // Adjust selector to match actual DOM structure

    for (const element of wrapper.toArray()) {
      const $el = $(element);
      const title = $el.find('h3').first().text().trim() || $el.find('a').first().text().trim();
      const description = $el.find('p').first().text().trim();
      const a = $el.find('a').first();
      const href = a.attr('href');
      const url = href
        ? href.startsWith('http')
          ? href
          : `https://economictimes.indiatimes.com/news/india${href}`
        : '';

      // Apply finance category and zone filters
      const category = getFinanceCategory(title) || getFinanceCategory(description);
      if (!category) continue; // Skip non-finance-related news
      const zone = getZone(title + ' ' + description);

      news.push({
        title,
        description,
        url,
        time: today,
        image: '',
        author: 'The Economics Times',
        category,
        zone,
        source: 'theeconomicsTimes',   
      });
    }

    return news;
  } catch (error:any) {
    console.error('Cheerio Times of India Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw new Error(`Failed to scrape Times of India: ${error.message}`);
  }

}
