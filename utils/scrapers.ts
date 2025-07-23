import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import Parser from 'rss-parser';
// @ts-ignore: If you see a type error for date-fns, run 'npm install date-fns'
import { format } from 'date-fns';
import type { Cheerio, CheerioAPI } from 'cheerio';

// Helper function to create a news object
function createNewsItem(
  headline: string,
  url: string,
  source: string,
  category: string,
  description = '',
  image = ''
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
  if (lower.includes('stock')) return 'stock';
  if (lower.includes('nifty')) return 'nifty';
  if (lower.includes('sensex')) return 'sensex';
  if (lower.includes('bse')) return 'bse';
  if (lower.includes('nse')) return 'nse';
  if (lower.includes('ipo')) return 'ipo';
  if (lower.includes('dividend')) return 'dividend';
  if (lower.includes('market')) return 'market';
  if (lower.includes('investment')) return 'investment';
  if (lower.includes('mutual fund')) return 'mutual fund';
  if (lower.includes('commodity')) return 'commodity';
  if (lower.includes('futures')) return 'futures';
  if (lower.includes('options')) return 'options';
  if (lower.includes('bond')) return 'bond';
  if (lower.includes('interest rate')) return 'interest rate';
  if (lower.includes('inflation')) return 'inflation';
  if (lower.includes('banknifty')) return 'banknifty';
  if (lower.includes('bank')) return 'bank';
  if (lower.includes('share')) return 'share';
  if (lower.includes('sebi')) return 'sebi';
  if (lower.includes('rbi')) return 'rbi';
  if (lower.includes('fintech')) return 'fintech';
  if (lower.includes('startup')) return 'startup';
  if (lower.includes('business')) return 'business';
  if (lower.includes('economy')) return 'economy';
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
  if (lower.includes('fii')) return 'fii';
  if (lower.includes('dii')) return 'dii';
  if (lower.includes('gst')) return 'gst';
  if (lower.includes('rbi policy')) return 'rbi policy';
  if (lower.includes('monetary policy')) return 'monetary policy';
  if (lower.includes('rupee')) return 'rupee';
  if (lower.includes('dollar')) return 'dollar';
  if (lower.includes('forex')) return 'forex';
  if (lower.includes('export')) return 'export';
  if (lower.includes('import')) return 'import';
  if (lower.includes('trade')) return 'trade';
  if (lower.includes('budget')) return 'budget';
  if (lower.includes('taxation')) return 'taxation';
  if (lower.includes('corporate')) return 'corporate';
  if (lower.includes('msme')) return 'msme';
  if (lower.includes('nbfc')) return 'nbfc';
  if (lower.includes('insurance')) return 'insurance';
  if (lower.includes('pension')) return 'pension';
  if (lower.includes('infrastructure')) return 'infrastructure';
  if (lower.includes('disinvestment')) return 'disinvestment';
  if (lower.includes('psu')) return 'psu';
  return null;
}

// Helper to get today's date in YYYY-MM-DD
function getTodayDate() {
  return format(new Date(), 'yyyy-MM-dd');
}

// Helper to extract title (h1-h6) and description (p) from a cheerio element
function extractTitleAndDescription($element: cheerio.Cheerio<any>) {
  let title = '';
  let description = '';

  // Title: h1 > h2 > a (in order, first found)
  const h1 = $element.find('h1').first();
  if (h1.length && h1.text().trim()) {
    title = h1.text().trim();
  } else {
    const h2 = $element.find('h2').first();
    if (h2.length && h2.text().trim()) {
      title = h2.text().trim();
    } else {
      const a = $element.find('a').first();
      if (a.length && a.text().trim()) {
        title = a.text().trim();
      }
    }
  }

  // Description: first p, else first span
  const p = $element.find('p').first();
  if (p.length && p.text().trim()) {
    description = p.text().trim();
  } else {
    const span = $element.find('span').first();
    if (span.length && span.text().trim()) {
      description = span.text().trim();
    }
  }

  return { title, description };
}

// Times of India
export async function scrapeTimesOfIndia() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://timesofindia.indiatimes.com/briefs', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000); // Wait for JS content
  const html = await page.content();
  const news = await page.$$eval('.brief_box', items => {
    // This part runs in browser context, so can't use extractTitleAndDescription directly
    // Instead, extract h1-h6 and p manually
    const results: any[] = [];
    items.forEach(box => {
      let title = '';
      for (let i = 1; i <= 6; i++) {
        const h = box.querySelector('h' + i);
        if (h && (h as HTMLElement).innerText && (h as HTMLElement).innerText.trim()) {
          title = (h as HTMLElement).innerText.trim();
          break;
        }
      }
      let description = '';
      const p = box.querySelector('p');
      if (p && (p as HTMLElement).innerText && (p as HTMLElement).innerText.trim()) {
        description = (p as HTMLElement).innerText.trim();
      }
      const a = box.querySelector('a');
      const url = a && (a as HTMLAnchorElement).href ? (a as HTMLAnchorElement).href.startsWith('http') ? (a as HTMLAnchorElement).href : 'https://timesofindia.indiatimes.com' + (a as HTMLAnchorElement).getAttribute('href') : '';
      results.push({
        title,
        description,
        url,
        author: 'Times of India',
        time: new Date().toISOString(),
        image: '',
        category: 'general',
        source: 'timesofindia',
      });
    });
    return results.filter(n => n.title && n.url);
  });
  await browser.close();
  const filtered = news.map(n => {
    const cat = getFinanceCategory(n.title) || getFinanceCategory(n.description);
    if (!cat) return null;
    return { ...n, category: cat };
  }).filter(Boolean);
  return filtered;
}

// CNBC
export async function scrapeCNBC() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.cnbc.com/world/?region=world', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const news = await page.$$eval('div.Card-titleContainer', items => {
    // This part runs in browser context
    return Array.from(items).map(box => {
      let title = '';
      for (let i = 1; i <= 6; i++) {
        const h = box.querySelector('h' + i);
        if (h && (h as HTMLElement).innerText && (h as HTMLElement).innerText.trim()) {
          title = (h as HTMLElement).innerText.trim();
          break;
        }
      }
      let description = '';
      const p = box.querySelector('p');
      if (p && (p as HTMLElement).innerText && (p as HTMLElement).innerText.trim()) {
        description = (p as HTMLElement).innerText.trim();
      }
      const a = box.querySelector('a.Card-title');
      const url = a && (a as HTMLAnchorElement).href ? (a as HTMLAnchorElement).href : '';
      return {
        title,
        description,
        url,
        author: 'CNBC',
        time: new Date().toISOString(),
        image: '',
        category: 'market',
        source: 'cnbc',
      };
    }).filter(n => n.title && n.url);
  });
  await browser.close();
  return news;
}

// Moneycontrol
export async function scrapeMoneycontrol() {
  const url = 'https://www.moneycontrol.com/news/business/';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const news: any[] = [];
  $('ul#category li').each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('http') ? href : 'https://www.moneycontrol.com' + href;
      }
      news.push({
        title,
        description,
        author: 'Moneycontrol',
        time: new Date().toISOString(),
        image: '',
        category: 'business',
        source: 'moneycontrol',
        url: link,
      });
    }
  });
  return news;
}

// RSS Feeds
export async function scrapeRssFeeds() {
  const parser = new Parser();
  const rssFeeds = [
    // Finance / Business
    'https://www.moneycontrol.com/rss/MCtopnews.xml',
    'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
    'https://www.financialexpress.com/feed/',
    'https://www.livemint.com/rss',
    'https://www.business-standard.com/rss/home_page_top_stories.rss',
   
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
  const placeholders = [
    'stock', 'nifty', 'growth','sensex','shares', 'bse', 'nse', 'ipo', 'dividend', 'market', 'investment', 'mutual fund', 'commodity', 'futures', 'options', 'bond', 'banknifty', 'bank', 'share', 'sebi', 'rbi', 'fii', 'dii', 'gst', 'rbi policy', 'monetary policy', 'rupee', 'dollar', 'forex', 'export', 'import', 'trade', 'budget', 'taxation', 'corporate', 'msme', 'nbfc', 'insurance', 'pension', 'infrastructure', 'disinvestment', 'psu', 'business', 'economy', 'finance', 'startup', 'valuation', 'funding', 'merger', 'acquisition', 'profit', 'loss', 'revenue', 'gdp', 'recession', 'fiscal', 'india', 'world'
  ];
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
     
        return {
          headline,
          description,
          author: source.trim(),
          time,
         
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

// LiveMint Latest News Scraper
export async function scrapeLivemintNews() {
  const url = 'https://www.livemint.com/latest-news';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $('li').each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('http') ? href : 'https://www.livemint.com' + href;
      }
      news.push({
        title,
        description,
        url: link,
        category: '',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// Economic Times Markets/Stocks News Scraper
export async function scrapeEconomicTimesNews() {
  const url = 'https://economictimes.indiatimes.com/markets/stocks/news';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $('li[data-section="Markets"]').each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('http') ? href : 'https://economictimes.indiatimes.com' + href;
      }
      news.push({
        title,
        description,
        url: link,
        category: '',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// News18 Business News Scraper
export async function scrapeNews18News() {
  const url = 'https://www.news18.com/business/';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $('li').each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('http') ? href : 'https://www.news18.com' + href;
      }
      news.push({
        title,
        description,
        url: link,
        category: '',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// Moneycontrol Economy News Scraper
export async function scrapeMoneycontrolEconomy() {
  const url = 'https://www.moneycontrol.com/news/business/economy/';
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  $('li').each((i, el) => {
    const $el = $(el);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('http') ? href : 'https://www.moneycontrol.com' + href;
      }
      news.push({
        title,
        description,
        url: link,
        category: '',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// India Today World/Business News Scraper
export async function scrapeIndiaTodayWorldNews() {
  const url = 'https://www.indiatoday.in/business';
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  const articles = $(".story__grid article").slice(0, 10);
  articles.each((i, article) => {
    const $el = $(article);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const titleTag = $el.find('h2 a');
      let link = '';
      if (titleTag.length) {
        link = 'https://www.indiatoday.in' + titleTag.attr('href');
      }
      news.push({
        title,
        description,
        url: link,
        category: 'world',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// LiveMint World News Scraper
export async function scrapeLivemintWorldNews() {
  const url = 'https://www.livemint.com/news/world';
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  const articles = $('h2.headline').parent().slice(0, 10);
  articles.each((i, article) => {
    const $el = $(article);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const linkTag = $el.find('a').first();
      let link = '';
      if (linkTag.length) {
        const href = linkTag.attr('href') || '';
        link = href.startsWith('/') ? 'https://www.livemint.com' + href : href;
      }
      news.push({
        title,
        description,
        url: link,
        category: 'world',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// Moneycontrol World News Scraper
export async function scrapeMoneycontrolWorldNews() {
  const url = 'https://www.moneycontrol.com/world/news/';
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  const articles = $('ul#cagetory li').slice(0, 10);
  articles.each((i, article) => {
    const $el = $(article);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('http') ? href : 'https://www.moneycontrol.com' + href;
      }
      news.push({
        title,
        description,
        url: link,
        category: 'world',
        source: '',
        date: today
      });
    }
  });
  return news;
}

// Economic Times International News Scraper
export async function scrapeEconomicTimesWorldNews() {
  const url = 'https://economictimes.indiatimes.com/news/international';
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  const today = getTodayDate();
  const news: any[] = [];
  const articles = $('.top-news ul.list1 li').slice(0, 10);
  articles.each((i, article) => {
    const $el = $(article);
    const { title, description } = extractTitleAndDescription($el);
    if (title && description) {
      const a = $el.find('a').first();
      let link = '';
      if (a.length) {
        const href = a.attr('href') || '';
        link = href.startsWith('/') ? 'https://economictimes.indiatimes.com' + href : href;
      }
      news.push({
        title,
        description,
        url: link,
        category: 'world',
        source: '',
        date: today
      });
    }
  });
  return news;
}