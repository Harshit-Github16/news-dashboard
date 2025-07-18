import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import News from '@/models/News';
import { 
  scrapeTimesOfIndia, 
  scrapeTheHindu,
  scrapeUNNews,
  scrapeEconomicTimes,
  scrapeLivemint,
  scrapeBloomberg,
  scrapeForexfactory,
  scrapeReuters,
  scrapeMint,
  scrapeCNBC,
  scrapeZeeBusiness,
  scrapeMoneycontrol,
  scrapeInvesting,
  scrapeFexsheet,
  scrapeRssFeeds
} from '@/utils/scrapers';
import { rewriteNews } from '@/utils/aiRewriter';

const scrapers: any = {
  timesofindia: scrapeTimesOfIndia,
  thehindu: scrapeTheHindu,
  unnews: scrapeUNNews,
  economictimes: scrapeEconomicTimes,
  livemint: scrapeLivemint,
  bloomberg: scrapeBloomberg,
  forexfactory: scrapeForexfactory,
  reuters: scrapeReuters,
  mint: scrapeMint,
  cnbc: scrapeCNBC,
  zeebusiness: scrapeZeeBusiness,
  moneycontrol: scrapeMoneycontrol,
  investing: scrapeInvesting,
  fexsheet: scrapeFexsheet,
  rssfeed: scrapeRssFeeds
};

export async function POST(req: NextRequest) {
  const { source } = await req.json();
  if (!source) {
    return NextResponse.json({ error: 'source required' }, { status: 400 });
  }
  const scraper = scrapers[source];
  if (!scraper) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }
  await dbConnect();
  const scraped = (await scraper()).slice(0, 5); // Limit to 5 news items
  const rewritten = [];
  for (const news of scraped) {
    // Generate slug from headline
    const slug = (news.headline || '').slice(0, 25).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const regen = await rewriteNews({ ...news, slug });
    // Check for duplicate by url only
    const exists = await News.findOne({ url: regen.url });
    if (!exists) {
      const created = await News.create(regen);
      rewritten.push(created);
    } else {
      // Optionally update existing news with new data
      await News.updateOne({ url: regen.url }, regen);
      rewritten.push(await News.findOne({ url: regen.url }));
    }
  }
  return NextResponse.json({ count: rewritten.length, news: rewritten });
} 