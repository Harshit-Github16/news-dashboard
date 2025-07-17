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
  // Generate URL from headline
  let url = data.headline
    .slice(0, 20)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  // If shortUrl is provided, use it, else use generated url
  const news = await News.create({
    ...data,
    url: data.shortUrl && data.shortUrl.trim() ? data.shortUrl : url,
    time: new Date().toISOString(),
  });
  return NextResponse.json(news, { status: 201 });
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