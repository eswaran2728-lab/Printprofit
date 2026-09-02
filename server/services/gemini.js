import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const EXTRACT_PROMPT = `You are reading a screenshot of an order/sale from an e-commerce or social selling platform (e.g. TikTok Shop, Shopee, Instagram DM).
Extract the sale details and respond with ONLY a JSON object, no markdown, no explanation, matching this shape:
{
  "productName": string | null,   // the product/item title as shown
  "itemPrice": number | null,     // the item subtotal / price paid for the item(s), in the currency shown, as a plain number (no currency symbol)
  "platform": string | null,      // e.g. "TikTok Shop", "Shopee", "Instagram", "WhatsApp" — infer from screenshot branding/content if possible
  "date": string | null,          // order date if visible, formatted YYYY-MM-DD
  "buyerLocation": string | null  // buyer's city/state if visible, otherwise null
}
If a field isn't visible or you're not confident, use null for it. Respond with raw JSON only.`;

export async function extractSaleFromImage(base64Data, mimeType) {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    { text: EXTRACT_PROMPT },
  ]);

  const text = result.response.text().trim();
  const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error('Could not parse extraction result');
  }
}
