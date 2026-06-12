import { NextRequest, NextResponse } from 'next/server'

const prompts: Record<string, string> = {
  projects: `You are an ops analyst for Inbiso, a B2B fire safety systems company in Hyderabad. 
Analyze this project data and give a 2-3 sentence summary: highlight any delayed projects, 
budget concerns, or phase bottlenecks. Be direct and actionable.`,
  manpower: `You are an ops analyst for Inbiso, a B2B fire safety systems company. 
Analyze this manpower data and give a 2-3 sentence summary: flag idle workers, 
daily cost burn, and any allocation risks. Be direct and actionable.`,
  cashflow: `You are an ops analyst for Inbiso, a B2B fire safety systems company. 
Analyze this cashflow data and give a 2-3 sentence summary: highlight net position, 
any payment delays, cashflow risks, or surplus opportunities. Be direct and actionable.`,
}

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json()
    const prompt = prompts[type] || prompts.projects

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Data: ${JSON.stringify(data)}` },
        ],
        max_tokens: 200,
      }),
    })

    const json = await res.json()
    const summary = json.choices?.[0]?.message?.content || 'No summary available.'
    return NextResponse.json({ summary })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ summary: 'AI summary unavailable.' }, { status: 500 })
  }
}