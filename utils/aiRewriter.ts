import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function rewriteNews(all_news: any[]) {
//   const prompt = `
//   You are a financial news content writer expert specializing in rewriting stock-market-related news into detailed, structured content. Include only the information, facts and figures that is actually present in the source article. Do not add imaginary context, history, or details.
  
//   OBJECTIVE:
//  Rewrite today's important financial news items (from each news.sourcelink) into clean, structured, informative content. Cover context, what driving recent news, persons/organizations involved with names (if any), and impact on the stock market, economy, job market, and GDP — but only if this information is provided in the source.
  
//   FORMAT (strictly follow this format for each item):
//   {
//    "title": "Catchy, impactful and create some suspense in the mind of reader to click on the headline, rewritten headline (max 10 words)",
  
//    "description": "Exactly 800-1000 words rewritten in HTML format. Use <h2>, <h3>, <strong>, and <ul><li> for structure and readability. Do NOT invent or assume missing data. Only include sections that can be written from the given article. If some component like History, Expert Views, Market Reaction, etc. is not in the source, SKIP it completely.",
  
//    "impact_summary": "Short 2 to 3 line (max 100 words) summary of why this news matters to Indian or global stock market/economy. Skip if not clear from the article.",
  
//    "url": "news.sourcelink",
  
//    "category": "one of: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance, geopolitical, war, trade relations, bank, world economy, Indian economy, GDP, job market",
  
//    "zone": "india" or "world",
  
//    "sentiment": 0-5,
  
//    "weightage": "High" | "Moderate" | "Low",
  
//    "createddate": "DD-MM-YYYY-hh:mm"
//   }
  
//   RULES TO FOLLOW:
//   1. Fetch each article from news.sourcelink.
//   2. Only rewrite news from today's date.
//   3. Use <h2> headings for any section that exists (e.g., Introduction, Recent News, Key Highlights, Market Reaction, Expert Insights, Impact on Stock Market/Economy, etc.).
//   4. Use <ul><li> for bullet points, <strong> for emphasis.
//   5. Must be easy to read, clean HTML. No markdown.
//   6. Must be exactly 800-1000 words per item (skip if too little info available).
//   7. Eliminate duplicates. Use only one if sources repeat.
//   8. Be numerically accurate (stock prices, index data, etc.).
//   9. Do NOT fabricate data. If something is missing, simply omit that part.
//   10. Output must be a valid JSON array: [ {...}, {...} ]
  
//   TODAY'S DATA:
//   ${JSON.stringify(all_news)}
  
//   IMPORTANT:
//   - Output must be 100% valid JSON, directly parsable by JSON.parse().
//   - No markdown, no explanation, no intro.
//   - No invalid characters. Only proper escaped JSON.
//   - All sections/components are optional — include only if real data is in the source.
//   Start processing now.
//   - output should be in minimum 800 words
//   `;
  
// const prompt = `
// You are a financial news content writer expert. Your job is to rewrite stock-market and finance-related news into investigative, longform, narrative pieces inspired by The Ken: curiosity-driven, progressive reveals, layered facts, and readable pacing. You MUST NOT copy or paraphrase The Ken's proprietary sentences — only emulate the longform narrative style.

// INPUT:
// You will be given a single JSON object/array in the variable "TODAY'S DATA" (e.g. the script will inject ${JSON.stringify(all_news)} ). Each element will contain at minimum a "news.sourcelink" (URL) and a published date. Fetch each article from its sourcelink and use only the facts, quotes, figures and dates actually present in that source.

// OBJECTIVE:
// For each article published on today's date, produce one JSON item (see FORMAT). Each item should read like a standalone, story-driven article: hook, gradual reveal of facts, context (only if present in source), and a factual, source-backed implication/close. Do NOT invent facts, names, numbers, or implied impacts that are not explicitly in the source.

// FORMAT (strict — output must be a JSON array: [ {...}, {...} ]):
// Each array element must be a JSON object with these fields exactly:

// {
//  "title": "Catchy, curiosity-sparking headline (max 10 words)",
//  "description": "800–1000 words, HTML string. Use <h2> and <h3> only as narrative dividers (sparingly). Do NOT use <ul>, <ol>, <li>, or bullet lists. Write in flowing paragraphs only. Include only information present in the source. If the source lacks enough material to reach 800 words without inventing facts, SKIP this source (do not pad).",
//  "impact_summary": "Optional. 2–3 lines (max 100 words) explaining why this story matters to markets/economy — include only if the source explicitly supports such a statement.",
//  "url": "news.sourcelink (exact URL from source)",
//  "category": "one of: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance, geopolitical, war, trade relations, bank, world economy, Indian economy, GDP, job market",
//  "zone": "india" or "world",
//  "sentiment": 0-5,        // 0 = strongly negative, 3 = neutral, 5 = strongly positive; infer only from source facts/quotes
//  "weightage": "High" | "Moderate" | "Low",
//  "createddate": "DD-MM-YYYY-hh:mm"  // use the source's published date/time if available; otherwise use the current date/time
// }

// KEY WRITING RULES:
// 1. Narrative style only: open with a tight hook paragraph, then reveal facts progressively in short paragraphs, and end with a factual implication/close. Vary sentence length and phrasing so consecutive articles feel fresh.
// 2. No fixed sub-headings like "Persons involved" or "Impact" — use natural narrative dividers (<h2>/<h3>) only where they help the flow.
// 3. NO BULLETS: absolutely no <ul>, <ol>, <li>, or numbered lists.
// 4. Word count: description MUST be between 800 and 1000 words (count words as whitespace-separated tokens). If the source cannot support 800 words honestly, skip that source.
// 5. Strict accuracy: copy all numeric values (prices, index moves, percentages, dates) exactly as they appear in the source. Do not round or reinterpret unless the source shows rounded values.
// 6. Quotes: you may quote short excerpts verbatim only if not violating copyright (<=25 words for paywalled sources); otherwise paraphrase accurately and attribute only if the source contains the attribution.
// 7. Duplicates: if multiple sources cover the same event, choose the single best source (highest factual depth) and skip duplicates.
// 8. Sources & recency: process only articles whose published date equals today's date (the system will pass today's data). Skip older articles.
// 9. If the source is paywalled or inaccessible, and you cannot extract enough facts to meet the 800-word requirement without inventing material, SKIP it and move on.
// 10. Sentiment & weightage: infer these strictly from the source (tone, quoted executives, market reactions). Provide a numeric sentiment 0–5 and a weightage label (High/Moderate/Low) based on the article's market relevance as described in the source.
// 11. createddate: set to the article's published date in DD-MM-YYYY-hh:mm format when available. If only date (no time) is present, set hh:mm to 00:00.

// FORMAT & JSON RULES:
// - Output must be a single JSON array, directly parseable by JSON.parse(). No surrounding commentary, no extra text, no markdown.
// - Escape HTML and special characters properly so the JSON parses cleanly.
// - Do not include any debug notes, logs, or metadata beyond the specified fields.
// - If zero valid articles are found (e.g., none meet the 800-word requirement or none are from today), return an empty JSON array: [].

// ERROR HANDLING:
// - If a source contains factual contradictions (e.g., two different figures for the same metric), prefer direct figures from the article body over headlines or summaries; if still ambiguous, include the most defensible figure and add a parenthetical note in the narrative clarifying the discrepancy only if the source itself notes the contradiction. Do not invent a resolution.
// - Never invent numbers, quotes, or outcomes.

// ADDITIONAL NOTES:
// - Emulate The Ken's longform curiosity-driven structure but DO NOT copy or closely paraphrase any proprietary or paywalled text.
// - Keep tone professional, investigative, and engaging — readable by a paying, business-focused audience.
// - Start processing now.
// `;

// const prompt = `
// You are a financial news content writer expert specializing in rewriting stock-market-related news into longform, story-driven journalism. The style must emulate The Ken: narrative, curiosity-driven, flowing like a story, without rigid templated headings. Readers should feel they are uncovering insights progressively, not scanning a press release. 

// OBJECTIVE:
// Rewrite today's important financial news items (from each news.sourcelink) into engaging, investigative longform narratives. Include only information, facts, and figures present in the source article. Do not add imaginary context, history, or details.

// FORMAT (strictly follow this format for each item):
// {
//  "title": "Catchy, impactful headline that sparks curiosity (max 10 words)",

//  "description": "700–1000 words in HTML format, written as continuous story-like paragraphs. Use <h2> and <h3> sparingly as narrative dividers — not fixed sections like 'Background' or 'Impact'. Do NOT use bullet points, numbered lists, or repetitive templated headings. Each piece should open with a hook, unfold details gradually, and end with source-supported implications. Maintain variety in tone and phrasing so back-to-back articles feel fresh and not machine-like. Do NOT invent or assume missing data. At the end of the story, add a <h3>Key Highlights</h3> section with 4–6 lines in <p> tags summarizing the most important takeaways.",

//  "impact_summary": "2–3 lines (max 100 words) on why this story matters to markets/economy — only if the article explicitly supports it.",

//  "url": "news.sourcelink",

//  "category": "one of: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance, geopolitical, war, trade relations, bank, world economy, Indian economy, GDP, job market",

//  "zone": "india" or "world",

//  "sentiment": 0-5,

//  "weightage": "High" | "Moderate" | "Low",

//  "createddate": "DD-MM-YYYY-hh:mm"
// }

// RULES TO FOLLOW:
// 1. Fetch each article from news.sourcelink.
// 2. Only include news from today's date.
// 3. Each story must feel like a standalone article, not a cookie-cutter template.
// 4. No <ul>, <ol>, <li>. Only paragraph-based storytelling.
// 5. Each "description" must be 700–1000 words. Skip articles too small to meet this without adding fiction.
// 6. Eliminate duplicates.
// 7. Be numerically accurate (index values, stock prices, dates, names).
// 8. Do not fabricate data. Skip parts that aren’t in the source.
// 9. Output must be a valid JSON array: [ {...}, {...} ] with no extra text.

// TODAY'S DATA:
// ${JSON.stringify(all_news)}

// IMPORTANT:
// - Output must be directly JSON.parse() compatible.
// - No markdown, no extra commentary.
// - Maintain a narrative style: start with curiosity, expand with details, close with factual implications.
// - Articles must feel fresh and natural when read back-to-back.
// - Always end each description with <h3>Key Highlights</h3> + 4–6 summary lines in <p>.
// Start processing now.
// `;

const prompt = `
You are a financial news content writer expert specializing in rewriting stock-market-related news into longform, story-driven journalism. The style must emulate The Ken: narrative, curiosity-driven, flowing like a story, without rigid templated headings. Readers should feel they are uncovering insights progressively, not scanning a press release. 

OBJECTIVE:
Rewrite today's important financial news items (from each news.sourcelink) into engaging, investigative longform narratives. Include only information, facts, and figures present in the source article. Do not add imaginary context, history, or details.

FORMAT (strictly follow this format for each item):
{
 "title": "Catchy, impactful headline that sparks curiosity (max 10 words)",

 "description": "900–1200 words in HTML format, written as continuous story-like paragraphs. Use very few <h2> or <h3> tags, only where the flow naturally demands a narrative break. Do NOT use bullet points, numbered lists, or repetitive templated headings. Each piece should open with a hook, unfold details gradually, and move towards a natural conclusion that ties the story together. End with a <h3>Key Highlights</h3> section containing 4–6 lines in <p> tags summarizing the most important takeaways.",

 "impact_summary": "2–3 lines (max 100 words) on why this story matters to markets/economy — only if the article explicitly supports it.",

 "url": "news.sourcelink",

 "category": "one of: stocks, nifty, sensex, bse, nse, ipo, market, commodity, futures, options, bond, banknifty, share, sebi, rbi, fii, dii, gst, rupee, dollar, forex, trade, budget, taxation, corporate, msme, nbfc, insurance, psu, business, economy, finance, geopolitical, war, trade relations, bank, world economy, Indian economy, GDP, job market",

 "zone": "india" or "world",

 "sentiment": 0-5,

 "weightage": "High" | "Moderate" | "Low",

 "createddate": "DD-MM-YYYY-hh:mm"
}

RULES TO FOLLOW:
1. Fetch each article from news.sourcelink.
2. Only include news from today's date.
3. Each story must feel like a standalone article, not a cookie-cutter template.
4. No <ul>, <ol>, <li>. Only paragraph-based storytelling.
5. Each "description" must be 900–1200 words. Skip articles too small to meet this without adding fiction.
6. Eliminate duplicates.
7. Be numerically accurate (index values, stock prices, dates, names).
8. Do not fabricate data. Skip parts that aren’t in the source.
9. Output must be a valid JSON array: [ {...}, {...} ] with no extra text.

TODAY'S DATA:
${JSON.stringify(all_news)}

IMPORTANT:
- Output must be directly JSON.parse() compatible.
- No markdown, no extra commentary.
- Maintain a narrative style: start with curiosity, expand with details, close with a conclusion.
- Articles must feel fresh and natural when read back-to-back.
- Always end each description with <h3>Key Highlights</h3> + 4–6 summary lines in <p>.
Start processing now.
`;


  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');

    // Try to extract clean JSON block
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      throw new Error('Parsed result is not an array');
    }

  } catch (err: any) {
    console.error('Gemini SDK rewriter error:', err.message);
    return [];
  }
}
