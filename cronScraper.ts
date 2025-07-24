import {
  scrapeTimesOfIndia,
  scrapeMoneycontrol,
  scrapeCNBC,
  scrapeRssFeeds,
  scrapeLivemintNews,
  scrapeEconomicTimesNews,
  scrapeNews18News,
  scrapeMoneycontrolEconomy,
  scrapeIndiaTodayWorldNews,
  scrapeLivemintWorldNews,
  scrapeMoneycontrolWorldNews,
  scrapeEconomicTimesWorldNews
} from './utils/scrapers';
import { rewriteNews } from './utils/aiRewriter';
import dbConnect from './utils/db';
import News from './models/News';
import cron from 'node-cron';

const scrapers = [
  scrapeTimesOfIndia,
  scrapeMoneycontrol,
  scrapeCNBC,
  scrapeRssFeeds,
  scrapeLivemintNews,
  scrapeEconomicTimesNews,
  scrapeNews18News,
  scrapeMoneycontrolEconomy,
  scrapeIndiaTodayWorldNews,
  scrapeLivemintWorldNews,
  scrapeMoneycontrolWorldNews,
  scrapeEconomicTimesWorldNews
];

async function runAllScrapers() {
  await dbConnect();
  let totalNew = 0;
  let totalUpdated = 0;
  for (const scraper of scrapers) {
    try {
      const news = await scraper();
      const rewritten = await rewriteNews(news);
      for (const item of rewritten) {
        if (!item.url) continue;
        // Map title to headline for backward compatibility
        const newsData = {
          title: item.title,
          headline: item.title, // for old code compatibility
          description: item.description,
          url: item.url,
          category: item.category,
          zone: item.zone,
          sentiment: item.sentiment,
          weightage: item.weightage,
          createddate: item.createddate,
          // Optionally add image, author, source, etc. if present in item
          image: item.image || '',
          author: item.author || '',
          source: item.source || '',
          published: false,
          time: new Date().toISOString(),
        };
        const exists = await News.findOne({ url: item.url });
        if (!exists) {
          await News.create(newsData);
          totalNew++;
        } else {
          await News.updateOne({ url: item.url }, newsData);
          totalUpdated++;
        }
      }
      console.log(`Scraper ${scraper.name}: ${rewritten.length} rewritten, ${totalNew} new, ${totalUpdated} updated.`);
    } catch (e) {
      console.error('Error in scraper:', scraper.name, e);
    }
  }
  console.log(`Total new: ${totalNew}, total updated: ${totalUpdated}`);
}

// Schedule the cron job to run every 45 minutes
cron.schedule('*/45 * * * *', async () => {
  console.log('Cron job started: Scraping news at', new Date().toLocaleString());
  await runAllScrapers();
});

// Optionally export for manual runs
export { runAllScrapers }; 