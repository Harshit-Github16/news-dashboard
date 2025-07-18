import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const username = formData.get('username');
  const appPassword = formData.get('appPassword');
  const authHeader = 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');

  const wpForm = new FormData();
  wpForm.append('file', file as Blob);

  const res = await fetch('https://trending.niftytrader.in/wp-json/wp/v2/media', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: wpForm,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 