import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const WP_URL = 'https://trending.niftytrader.in/wp-json/wp/v2/posts';
const WP_USER = 'abuzain';
const WP_APP_PASS = 'YyVf hdCk gCD8 7BB7 lMVV UtxF';

// Example category mapping (update as needed)
const categoryMap: Record<string, number> = {
  market: 615,
  // Add more mappings as needed
};

async function getMediaIdFromUrl(imageUrl: string) {
  if (!imageUrl || !imageUrl.includes('/wp-content/')) return null;
  // Try to find media by URL
  const mediaApi = 'https://trending.niftytrader.in/wp-json/wp/v2/media?per_page=100&search=' + encodeURIComponent(imageUrl.split('/').pop() || '');
  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');
  const res = await axios.get(mediaApi, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });
  const found = res.data.find((m: any) => m.source_url === imageUrl);
  return found ? found.id : null;
}

export async function POST(req: NextRequest) {
  const news = await req.json();
  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');
  const categoryId = categoryMap[news.category] || 615;
  let featured_media = null;
  if (news.image && news.image.includes('/wp-content/')) {
    featured_media = await getMediaIdFromUrl(news.image);
  }
  const postData: any = {
    title: news.headline,
    content: `<img src='${news.image}' style='max-width:100%;height:auto' /><br/>${news.description}`,
    status: 'publish',
    categories: [categoryId],
    excerpt: news.description?.slice(0, 200),
  };
  if (featured_media) postData.featured_media = featured_media;
  try {
    const wpRes = await axios.post(WP_URL, postData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
    return NextResponse.json(wpRes.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, details: err.response?.data }, { status: 500 });
  }
} 