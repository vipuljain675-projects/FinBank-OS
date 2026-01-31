import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Investment from '@/lib/models/Investment';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // --- 1. AUTHENTICATION ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).userId) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    const userId = (decoded as any).userId;

    const { message } = await req.json();

    await connectToDatabase();

    // --- 2. GATHER DATA ---
    const accounts = await Account.find({ userId }).lean();
    const investments = await Investment.find({ userId }).lean();
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(20).lean();

    const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalInvested = investments.reduce((sum, i) => sum + (i.pricePerShare * i.quantity), 0);
    const netWorth = totalCash + totalInvested;
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // --- 3. SYSTEM PROMPT ---
// --- 3. CREATE THE PERSONA ---
    const systemPrompt = `
      You are FinBank Pro, a sophisticated hedge fund portfolio manager.
      Your goal is to maximize the user's wealth using data-driven strategies.

      USER FINANCIAL DATA:
      - Net Worth: $${netWorth.toLocaleString()} (Cash: $${totalCash.toLocaleString()}, Invested: $${totalInvested.toLocaleString()})
      - Recent Spending: $${expenses.toLocaleString()}
      - Current Portfolio: ${investments.map(i => `${i.symbol} (${i.quantity})`).join(', ') || 'None'}

      INSTRUCTIONS:
      1. Analyze the user's financial position.
      2. Suggest a specific strategic allocation in DOLLAR AMOUNTS and PERCENTAGES only.
      3. DO NOT suggest specific "Number of Shares" because you do not have live pricing data.
      4. ALWAYS output the allocation plan in a Markdown Table with columns: [Asset, Allocation %, Amount ($), Rationale].
      5. Keep the text brief, professional, and confident.
    `;
    // --- 4. AI ENGINE (Debugged) ---
    
    // STRATEGY A: GROQ CLOUD (Fastest)
    if (process.env.GROQ_API_KEY) {
      try {
        console.log("⚡ Connecting to Groq Cloud...");
        
        // Trim key to remove accidental spaces from .env
        const apiKey = process.env.GROQ_API_KEY.trim();

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            // UPDATED MODEL NAME (More stable)
            model: "llama-3.3-70b-versatile", 
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: String(message || "Financial advice") }
            ],
            temperature: 0.5
          })
        });

        if (!groqRes.ok) {
          // LOG THE EXACT ERROR FROM GROQ
          const errorText = await groqRes.text();
          console.error(`❌ Groq Error Details:`, errorText);
          throw new Error(`Groq Status: ${groqRes.status}`);
        }

        const groqData = await groqRes.json();
        return NextResponse.json({ advice: groqData.choices[0]?.message?.content });

      } catch (error) {
        console.warn("⚠️ Groq Failed (Check logs above for reason). Switching to Local...");
      }
    }

    // STRATEGY B: LOCAL FALLBACK
    // (Only runs if Groq fails)
    try {
      console.log("🧠 Connecting to Local FinBank Brain...");
      const localResponse = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'finbank',
          prompt: `${systemPrompt}\n\nUSER: ${message}`,
          stream: false,
          options: { num_ctx: 2048 } // Reduce memory usage
        }),
      });

      if (localResponse.ok) {
        const data = await localResponse.json();
        return NextResponse.json({ advice: data.response });
      }
    } catch (e) {
      console.error("❌ Local Brain also failed.");
    }

    return NextResponse.json({ advice: "System: AI services are currently offline. Please check your API Key." });

  } catch (error: any) {
    return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
  }
}