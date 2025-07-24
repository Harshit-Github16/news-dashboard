import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import News from '@/models/News';
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
} from '@/utils/scrapers';
import { rewriteNews } from '@/utils/aiRewriter';

const scrapers: any = {
  timesofindia: scrapeTimesOfIndia,
  moneycontrol: scrapeMoneycontrol,
  cnbc: scrapeCNBC,
  // rssfeed: scrapeRssFeeds,
  livemintnews: scrapeLivemintNews,
  economictimesnews: scrapeEconomicTimesNews,
  news18news: scrapeNews18News,
  moneycontroleconomy: scrapeMoneycontrolEconomy,
  indiatodayworld: scrapeIndiaTodayWorldNews,
  livemintworld: scrapeLivemintWorldNews,
  moneycontrolworld: scrapeMoneycontrolWorldNews,
  economictimesworld: scrapeEconomicTimesWorldNews
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
  const scraped = (await scraper()); // Limit to 5 news items
  const saved = [];
  for (const news of scraped) {
    const slug = (news.headline || news.title || '').slice(0, 25).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const url = news.url;
    const titleText = news.title || news.headline || '';
    const descText = news.description || '';
    if (!url || titleText.trim().length < 50 || descText.trim().length < 100) continue;
    let toSave = null;
    try {
      const rewrittenArr = await rewriteNews([{ ...news, slug }]);
      if (Array.isArray(rewrittenArr) && rewrittenArr.length > 0 && rewrittenArr[0]?.url && rewrittenArr[0]?.title && rewrittenArr[0]?.description && rewrittenArr[0].title.trim().length >= 50 && rewrittenArr[0].description.trim().length >= 100) {
        toSave = rewrittenArr[0];
      }
    } catch (err) {
      // Ignore Gemini error, fallback to original
    }
    if (!toSave) {
      toSave = { ...news, slug };
    }
    // Normalize sentiment: map -5 to 5 => 0 to 5
    if (typeof toSave.sentiment === 'number') {
      // Clamp between -5 and 5 just in case
      let s = Math.max(-5, Math.min(5, toSave.sentiment));
      toSave.sentiment = Math.round(((s + 5) / 10) * 5); // -5=>0, 0=>2.5, 5=>5
    }
    // Only save if both title and description are present and meet length requirements
    const finalTitle = toSave.title || toSave.headline || '';
    const finalDesc = toSave.description || '';
    if (finalTitle.trim().length >= 50 && finalDesc.trim().length >= 100) {
      const exists = await News.findOne({ url: toSave.url });
      if (!exists) {
        const created = await News.create(toSave);
        saved.push(created);
      } else {
        await News.updateOne({ url: toSave.url }, toSave);
        saved.push(await News.findOne({ url: toSave.url }));
      }
    }
  }
  return NextResponse.json({ count: saved.length, news: saved });
} 