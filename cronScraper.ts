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

        const newsData = {
          title: item.title,
          headline: item.title,
          description: item.description,
          url: item.url,
          category: item.category,
          zone: item.zone,
          sentiment: item.sentiment,
          weightage: item.weightage,
          createddate: item.createddate,
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

      console.log(`✅ Scraper ${scraper.name}: ${rewritten.length} rewritten, ${totalNew} new, ${totalUpdated} updated.`);

    } catch (e) {
      console.error(`❌ Error in scraper ${scraper.name}:`, e);
    }
  }

  console.log(`✅ Total new: ${totalNew}, total updated: ${totalUpdated}`);
}

// ✅ Run every 45 minutes
cron.schedule(
  '*/45 * * * *',
  async () => {
    console.log('🕒 Cron job started: Running all scrapers (every 45 minutes)');
    try {
      await runAllScrapers();
      console.log('✅ All scrapers ran successfully.');
    } catch (error) {
      console.error('❌ Error during cron job execution:', error);
    }
  },
  {
    timezone: 'Asia/Kolkata',
  }
);

// Optional manual trigger
export { runAllScrapers };
