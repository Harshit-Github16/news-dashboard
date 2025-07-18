import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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