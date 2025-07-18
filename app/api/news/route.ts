import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import News from '@/models/News';

export async function GET() {
  await dbConnect();
  const news = await News.find();
  return NextResponse.json(news);
}

export async function POST(req: Request) {
  await dbConnect();
  const data = await req.json();
  // Generate slug from headline if not provided
  let slug = data.slug && data.slug.trim() ? data.slug : (data.headline || '').slice(0, 25).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  // Generate URL from headline
  let url = data.headline
    .slice(0, 20)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  // If shortUrl is provided, use it, else use generated url
  const news = await News.create({
    ...data,
    slug,
    url: data.shortUrl && data.shortUrl.trim() ? data.shortUrl : url,
    time: new Date().toISOString(),
  });
  return NextResponse.json(news, { status: 201 });
}

export async function POST_SEO(req: Request) {
  const data = await req.json();
  const { headline = '', description = '', keyword = '' } = data;
  const plainDesc = description.replace(/<[^>]+>/g, '');
  const checks = {
    titleLength: headline.length,
    descLength: plainDesc.length,
    hasKeywordInTitle: keyword ? headline.toLowerCase().includes(keyword.toLowerCase()) : false,
    hasKeywordInDesc: keyword ? plainDesc.toLowerCase().includes(keyword.toLowerCase()) : false,
    titleOk: headline.length >= 40 && headline.length <= 70,
    descOk: plainDesc.length >= 120 && plainDesc.length <= 180,
  };
  let score = 0;
  if (checks.titleOk) score += 30;
  if (checks.descOk) score += 30;
  if (checks.hasKeywordInTitle) score += 20;
  if (checks.hasKeywordInDesc) score += 20;
  const suggestions = [];
  if (!checks.titleOk) suggestions.push('Title should be 40-70 characters.');
  if (!checks.descOk) suggestions.push('Description should be 120-180 characters.');
  if (!checks.hasKeywordInTitle) suggestions.push('Keyword missing in title.');
  if (!checks.hasKeywordInDesc) suggestions.push('Keyword missing in description.');
  return NextResponse.json({ score, checks, suggestions });
}

export async function PATCH(request: Request) {
  await dbConnect();
  const data = await request.json();
  const { _id, ...update } = data;
  if (!_id) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });
  const updated = await News.findByIdAndUpdate(_id, update, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  await dbConnect();
  const { _id } = await req.json();
  if (!_id) return new Response(JSON.stringify({ error: 'Missing _id' }), { status: 400 });
  try {
    await News.findByIdAndDelete(_id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
} 