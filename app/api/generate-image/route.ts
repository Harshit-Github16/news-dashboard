import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const WP_URL = 'https://trending.niftytrader.in/wp-json/wp/v2/media';
const WP_USER = 'abuzain';
const WP_APP_PASS = 'YyVf hdCk gCD8 7BB7 lMVV UtxF';

export const runtime = 'nodejs'; // Force Node.js runtime

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  // Convert file to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const res = await axios.post(WP_URL, buffer, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64'),
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': file.type,
      },
    });
    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, details: err.response?.data }, { status: 500 });
  }
} 