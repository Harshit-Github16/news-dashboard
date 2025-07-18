import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import Parser from 'rss-parser';

// Helper function to create a news object
function createNewsItem(headline: string, url: string, source: string, category: string, description = '', image = '') {
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

function containsFinanceKeywords(text: string) {
  if (!text) return false;
  const keywords = [
    'finance', 'stock', 'trading', 'Nse', 'Nifty', 'bankNifty',
    'ipo', 'dividend', 'market', 'investment',
    'sensex', 'bse', 'nse', 'commodity', 'futures', 'options', 'bond', 'interest rate', 'inflation',
    'bank',
    'share', 'portfolio', 'wealth',
    'asset', 'sebi', 'rbi', 'fintech', 'startup', 'business', 'economy', 'economic', 'growth', 'gdp',
    'recession', 'fiscal', 'revenue', 'profit', 'loss', 'merger', 'acquisition', 'funding', 'valuation'
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function getFinanceCategory(text: string) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes('stock')) return 'stock';
  if (lower.includes('trading')) return 'trading';
  if (lower.includes('nse')) return 'nse';
  if (lower.includes('bse')) return 'bse';
  if (lower.includes('sensex')) return 'sensex';
  if (lower.includes('nifty')) return 'nifty';
  if (lower.includes('ipo')) return 'ipo';
  if (lower.includes('dividend')) return 'dividend';
  if (lower.includes('market')) return 'market';
  if (lower.includes('investment')) return 'investment';
  if (lower.includes('commodity')) return 'commodity';
  if (lower.includes('futures')) return 'futures';
  if (lower.includes('options')) return 'options';
  if (lower.includes('bond')) return 'bond';
  if (lower.includes('interest rate')) return 'interest rate';
  if (lower.includes('inflation')) return 'inflation';
  if (lower.includes('bank')) return 'bank';
  if (lower.includes('share')) return 'share';
  if (lower.includes('portfolio')) return 'portfolio';
  if (lower.includes('wealth')) return 'wealth';
  if (lower.includes('asset')) return 'asset';
  if (lower.includes('sebi')) return 'sebi';
  if (lower.includes('rbi')) return 'rbi';
  if (lower.includes('fintech')) return 'fintech';
  if (lower.includes('startup')) return 'startup';
  if (lower.includes('business')) return 'business';
  if (lower.includes('economy')) return 'economy';
  if (lower.includes('economic')) return 'economy';
  if (lower.includes('growth')) return 'growth';
  if (lower.includes('gdp')) return 'gdp';
  if (lower.includes('recession')) return 'recession';
  if (lower.includes('fiscal')) return 'fiscal';
  if (lower.includes('revenue')) return 'revenue';
  if (lower.includes('profit')) return 'profit';
  if (lower.includes('loss')) return 'loss';
  if (lower.includes('merger')) return 'merger';
  if (lower.includes('acquisition')) return 'acquisition';
  if (lower.includes('funding')) return 'funding';
  if (lower.includes('valuation')) return 'valuation';
  if (lower.includes('finance')) return 'finance';
  if (lower.includes('banknifty')) return 'bankNifty';
  return null;
}

export async function scrapeTimesOfIndia() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://timesofindia.indiatimes.com/briefs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000); // Wait for JS content
  const html = await page.content();
  writeFileSync('toi.html', html);
  // Updated selector logic
  const news = await page.$$eval('.brief_box', items => {
    const results: any[] = [];
    items.forEach(box => {
      const h2s = box.querySelectorAll('h2');
      h2s.forEach(h2 => {
        const a = h2.querySelector('a');
        const p = h2.nextElementSibling && h2.nextElementSibling.tagName === 'P' ? h2.nextElementSibling : null;
        const descA = p ? p.querySelector('a') : null;
        results.push({
          headline: a?.innerText.trim() || '',
          url: a ? 'https://timesofindia.indiatimes.com' + a.getAttribute('href') : '',
          description: descA?.innerText.trim() || '',
          author: 'Times of India',
          time: new Date().toISOString(),
          image: '',
          category: 'general',
          source: 'timesofindia',
        });
      });
    });
    return results.filter(n => n.headline && n.url);
  });
  console.log('TOI news items found:', news.length);
  if (news.length === 0) {
    console.log('TOI HTML sample:', html.slice(0, 1000));
  }
  await browser.close();
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

export async function scrapeTheHindu() {
  const url = 'https://www.thehindu.com/news/';
  const { data } = await axios.get(url);
  console.log("data from the hindu",data)
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('.story-card-news').each((i, el) => {
    const headline = $(el).find('.title a').text().trim();
    const newsUrl = $(el).find('.title a').attr('href') || '';
    const description = $(el).find('.story-card-33-text').text().trim();
    const image = $(el).find('img').attr('src') || '';
    if (headline && newsUrl) {
      news.push({
        headline,
        description,
        author: 'The Hindu',
        time: new Date().toISOString(),
        image,
        category: 'general',
        source: 'thehindu',
        url: newsUrl,
      });
    }
  });
  console.log('The Hindu news items found:', news.length);
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

export async function scrapeUNNews() {
  const url = 'https://news.un.org/en/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('.view-content').each((i, el) => {
    const headline = $(el).find('.story-title a').text().trim();
    const newsUrl = $(el).find('.story-title a').attr('href') || '';
    const description = $(el).find('.story-lead').text().trim();
    if (headline && newsUrl) {
      news.push({
        headline,
        description,
        author: 'UN News',
        time: new Date().toISOString(),
        image: '',
        category: 'general',
        source: 'unnews',
        url: newsUrl.startsWith('http') ? newsUrl : 'https://news.un.org' + newsUrl,
      });
    }
  });
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

export async function scrapeEconomicTimes() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://economictimes.indiatimes.com/news', { waitUntil: 'domcontentloaded' });
  const news = await page.$$eval('.eachStory', items =>
    items.map(item => {
      const a = item.querySelector('a');
      const headline = a?.innerText.trim() || '';
      const url = a ? 'https://economictimes.indiatimes.com' + a.getAttribute('href') : '';
      const description = item.querySelector('p')?.innerText.trim() || '';
      return {
        headline,
        description,
        author: 'Economic Times',
        time: new Date().toISOString(),
        image: '',
        category: 'general',
        source: 'economictimes',
        url,
      };
    }).filter(n => n.headline && n.url)
  );
  await browser.close();
  console.log('Economic Times news items found:', news.length);
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

export async function scrapeLivemint() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.livemint.com/news', { waitUntil: 'domcontentloaded' });
  const news = await page.$$eval('section.listingPage .listingPageText', items =>
    items.map(item => {
      const a = item.querySelector('a');
      const headline = a?.innerText.trim() || '';
      const url = a ? 'https://www.livemint.com' + a.getAttribute('href') : '';
      const description = item.querySelector('p')?.innerText.trim() || '';
      return {
        headline,
        description,
        author: 'Livemint',
        time: new Date().toISOString(),
        image: '',
        category: 'general',
        source: 'livemint',
        url,
      };
    }).filter(n => n.headline && n.url)
  );
  await browser.close();
  console.log('Livemint news items found:', news.length);
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

// Bloomberg with Playwright
export async function scrapeBloomberg() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.bloomberg.com/markets', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const news = await page.$$eval('.LineupContent3Up_item__XpPd', items =>
    items.map(item => {
      const a = item.querySelector('a.StoryBlock_storyLink__5nXw8') as HTMLAnchorElement | null;
      const headlineSpan = item.querySelector('span.Headline_phoenix_DvzOu') as HTMLElement | null;
      const headline = headlineSpan ? headlineSpan.innerText.trim() : '';
      const url = a ? a.href : '';
      return {
        headline,
        url,
        author: 'Bloomberg',
        time: new Date().toISOString(),
        image: '',
        category: 'market',
        source: 'bloomberg',
        description: ''
      };
    })
  );
  await browser.close();
  return news.filter(n => n.headline && n.url);
}

export async function scrapeForexfactory() {
  const url = 'https://www.forexfactory.com/news';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('.flexposts__item').each((i, el) => {
    const a = $(el).find('span.flexposts__title.title a');
    const headline = a.text().trim();
    const newsUrl = a.attr('href') ? (a.attr('href')!.startsWith('http') ? a.attr('href') : 'https://www.forexfactory.com' + a.attr('href')) : '';
    if (headline && newsUrl) {
      news.push({
        headline,
        description: '',
        author: 'Forexfactory',
        time: new Date().toISOString(),
        image: '',
        category: 'forex',
        source: 'forexfactory',
        url: newsUrl,
      });
    }
  });
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

// Reuters with Playwright
export async function scrapeReuters() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.reuters.com/markets/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const news = await page.$$eval('a.text-module_link__1Mu9l.hero-card__headline__3ziv', items =>
    items.map(a => {
      const headlineSpan = a.querySelector('span.text-module_text__OG9ob.text-module_dark-grey__UFc18.text-module_medium__2Rl3O.text-module_heading__3_E5rU.heading-module_base__p-zb.heading-module_heading_3__5nQzZ') as HTMLElement | null;
      const headline = headlineSpan ? headlineSpan.innerText.trim() : '';
      const url = (a as HTMLAnchorElement).href;
      return {
        headline,
        url: url.startsWith('http') ? url : 'https://www.reuters.com' + url,
        author: 'Reuters',
        time: new Date().toISOString(),
        image: '',
        category: 'market',
        source: 'reuters',
        description: ''
      };
    })
  );
  await browser.close();
  return news.filter(n => n.headline && n.url);
}

export async function scrapeMint() {
  const url = 'https://www.livemint.com/news';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('section.cardHolder.expandObject.page-view-candidate.ga-tracking.eventFired').each((i, el) => {
    const headline = $(el).find('h2.headline').text().trim();
    const a = $(el).find('a');
    const newsUrl = a.attr('href') ? (a.attr('href')!.startsWith('http') ? a.attr('href') : 'https://www.livemint.com' + a.attr('href')) : '';
    const description = $(el).find('div.summary').text().trim();
    if (headline && newsUrl) {
      news.push({
        headline,
        description,
        author: 'Mint',
        time: new Date().toISOString(),
        image: '',
        category: 'market',
        source: 'mint',
        url: newsUrl,
      });
    }
  });
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

// CNBC with Playwright
export async function scrapeCNBC() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.cnbc.com/world/?region=world', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const news = await page.$$eval('div.Card-titleContainer a.Card-title', items =>
    items.map(a => ({
      headline: (a as HTMLAnchorElement).innerText,
      url: (a as HTMLAnchorElement).href,
      author: 'CNBC',
      time: new Date().toISOString(),
      image: '',
      category: 'market',
      source: 'cnbc',
      description: ''
    }))
  );
  await browser.close();
  return news.filter(n => n.headline && n.url);
}

export async function scrapeZeeBusiness() {
  const url = 'https://www.zeebiz.com/markets';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('div.bxborntcr h3 a').each((i, el) => {
    const headline = $(el).text().trim();
    const newsUrl = $(el).attr('href')?.startsWith('http') ? $(el).attr('href') : 'https://www.zeebiz.com' + $(el).attr('href');
    if (headline && newsUrl) {
      news.push({
        headline,
        description: '',
        author: 'Zee Business',
        time: new Date().toISOString(),
        image: '',
        category: 'market',
        source: 'zeebusiness',
        url: newsUrl,
      });
    }
  });
  return news;
}

export async function scrapeMoneycontrol() {
  const url = 'https://www.moneycontrol.com/news/business/';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('ul#category li h2 a').each((i, el) => {
    const headline = $(el).text().trim();
    const newsUrl = $(el).attr('href')?.startsWith('http') ? $(el).attr('href') : 'https://www.moneycontrol.com' + $(el).attr('href');
    if (headline && newsUrl) {
      news.push({
        headline,
        description: '',
        author: 'Moneycontrol',
        time: new Date().toISOString(),
        image: '',
        category: 'business',
        source: 'moneycontrol',
        url: newsUrl,
      });
    }
  });
  return news;
}

export async function scrapeInvesting() {
  const url = 'https://www.investing.com/news/';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('.title').each((i, el) => {
    const headline = $(el).text().trim();
    const a = $(el).closest('a');
    const newsUrl = a && a.attr('href') ? (a.attr('href')!.startsWith('http') ? a.attr('href') : 'https://www.investing.com' + a.attr('href')) : '';
    if (headline && newsUrl) {
      news.push({
        headline,
        description: '',
        author: 'Investing.com',
        time: new Date().toISOString(),
        image: '',
        category: 'market',
        source: 'investing',
        url: newsUrl,
      });
    }
  });
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.headline) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

// Fexsheet: URL not provided, stub only
export async function scrapeFexsheet() {
  return [];
}

// export async function scrapeRssFeeds() {
//   const parser = new Parser();
//   const rssFeeds = [
//     'https://www.moneycontrol.com/rss/MCtopnews.xml',
//     'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
//     'https://www.financialexpress.com/feed/'
//   ];
//   const allFeeds: any[] = [];
//   for (const url of rssFeeds) {
//     try {
//       const feed = await parser.parseURL(url);
//       const items = feed.items.map(item => {
//         const headline = item.title || '';
//         const url = item.link || '';
//         const description = item.contentSnippet || '';
//         const source = feed.title || '';
//         const cat = getFinanceCategory(headline) || getFinanceCategory(description);
//         if (!cat) return null;
//         return {
//           headline,
//           description,
//           author: source,
//           time: item.pubDate || new Date().toISOString(),
//           image: '',
//           category: cat,
//           source,
//           url,
//         };
//       }).filter(Boolean);
//       allFeeds.push(...items);
//     } catch (err: any) {
//       console.error(`Error parsing ${url}`, err.message);
//     }
//   }
//   return allFeeds;
// } 

export async function scrapeRssFeeds() {
  const parser = new Parser();

  const rssFeeds = [
    // Finance / Business
    'https://www.moneycontrol.com/rss/MCtopnews.xml',
    'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
    'https://www.financialexpress.com/feed/',
    'https://www.livemint.com/rss',
    'https://www.business-standard.com/rss/home_page_top_stories.rss',
    'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best',

    // National / General India News
    'https://feeds.feedburner.com/ndtvnews-top-stories',
    'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms',
    'https://www.hindustantimes.com/rss/topnews/rssfeed.xml',
    'https://indianexpress.com/feed/',
    'https://www.thehindu.com/news/national/feeder/default.rss',
    'https://www.news18.com/rss/india.xml',

    // Global News
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.reuters.com/tools/rss',
    'https://edition.cnn.com/services/rss/',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
  ];

  const allFeeds: any[] = [];
  const placeholders = ['finance', 'money', 'stock-market', 'bank', 'sebi','nifty','nse','sensex', 'business', 'news', 'india', 'world'];

  for (const url of rssFeeds) {
    try {
      const feed = await parser.parseURL(url);

      const items = feed.items.map(item => {
        const headline = item.title || '';
        const url = item.link || '';
        const description = item.contentSnippet || item.content || item.summary || '';
        const source = feed.title || '';
        const time = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        const cat = getFinanceCategory(headline) || getFinanceCategory(description) || 'General';

        const topic = placeholders[Math.floor(Math.random() * placeholders.length)];
        const image = `https://source.unsplash.com/800x400/?${topic}`;

        return {
          headline,
          description,
          author: source.trim(),
          time,
          image,
          category: cat.charAt(0).toUpperCase() + cat.slice(1),
          source: source.trim(),
          url,
        };
      }).filter(Boolean);

      allFeeds.push(...items);
    } catch (err: any) {
      console.error(`Error parsing ${url}`, err.message);
    }
  }

  return allFeeds;
}