import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const EXTRACT_PROMPT = `You are reading a screenshot from an e-commerce or social selling platform (e.g. TikTok Shop, Shopee, Instagram DM). It may be either:
(a) an order/item details screen showing a product, its price, and buyer info, or
(b) a settlement/payout/earnings breakdown screen showing revenue, platform fees, and a net settlement amount (no product name shown).

Extract the sale details and respond with ONLY a JSON object, no markdown, no explanation, matching this shape:
{
  "productName": string | null,   // the product/item title, only if visible (settlement screens usually don't show this — use null)
  "itemPrice": number | null,     // what the customer paid for the item(s) before platform fees: on an order screen, the item subtotal; on a settlement/breakdown screen, the "Total Revenue" or "Subtotal after (seller) discounts" figure. Plain number, no currency symbol.
  "netAmount": number | null,     // only on a settlement/breakdown screen: the final "Total settlement amount" / net payout after fees. Plain number, null otherwise.
  "platform": string | null,      // e.g. "TikTok Shop", "Shopee", "Instagram", "WhatsApp" — infer from screenshot branding, fee line items (e.g. "TikTok Shop commission fee"), or content
  "date": string | null,          // order/creation date if visible, formatted YYYY-MM-DD
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
