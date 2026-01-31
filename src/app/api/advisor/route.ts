import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import Investment from '@/lib/models/Investment';
import Account from '@/lib/models/Account';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).userId) return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    const userId = (decoded as any).userId;

    const { message } = await req.json();

    await connectToDatabase();

    // 1. Gather Data
    const accounts = await Account.find({ userId }).lean();
    const investments = await Investment.find({ userId }).lean();
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(20).lean();

    const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalInvested = investments.reduce((sum, i) => sum + (i.pricePerShare * i.quantity), 0);
    const netWorth = totalCash + totalInvested;
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // 2. The Prompt
    const systemPrompt = `
      You are a sophisticated financial strategist (Hedge Fund Manager Persona). 
      Your goal is to maximize the user's wealth using data-driven strategies.

      USER DATA:
      - Net Worth: $${netWorth} (Cash: $${totalCash}, Invested: $${totalInvested})
      - Recent Spending: $${expenses}
      - Portfolio: ${investments.map(i => `${i.symbol} (${i.quantity})`).join(', ') || 'Empty'}

      INSTRUCTIONS:
      1. Analyze the user's position.
      2. Suggest a specific portfolio allocation.
      3. CRITICAL: Output the allocation in a MARKDOWN TABLE.
      4. Keep text brief and strategic.
    `;

    const userPrompt = message || "How do I optimize my portfolio?";

    // 3. HYBRID AI SWITCHER 🔀
    // If we have a Groq Key, use Groq (Cloud). If not, use Ollama (Local).
    let aiResponseText = "";

    if (process.env.GROQ_API_KEY) {
      // --- OPTION A: GROQ CLOUD (Deployable) ---
      console.log("⚡ Using Groq Cloud AI...");
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Fast Llama 3 model
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (!groqRes.ok) throw new Error("Groq API Failed");
      const groqData = await groqRes.json();
      aiResponseText = groqData.choices[0]?.message?.content || "No advice generated.";

    } else {
      // --- OPTION B: LOCAL OLLAMA (Dev Mode) ---
      console.log("🦙 Using Local Ollama...");
      const ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `${systemPrompt}\n\nUSER QUESTION: ${userPrompt}`,
          stream: false
        })
      });

      if (!ollamaRes.ok) throw new Error("Ollama connection failed.");
      const ollamaData = await ollamaRes.json();
      aiResponseText = ollamaData.response;
    }

    return NextResponse.json({ advice: aiResponseText });

  } catch (error: any) {
    console.error("AI Error:", error.message);
    return NextResponse.json({ message: 'AI Service Error', error: error.message }, { status: 500 });
  }
}