import {Request,Response} from 'express'
import { extractJson } from '../lib/json'
import Redis from "ioredis"
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.AI_KEY as string);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.5-flash" });
const redis = new Redis(process.env.REDIS_KEY as string)

// The shape below is exactly what the frontend's <Plot> expects:
// each visual becomes a trace with { x, y, type } plus a title.
const systemInstruction={
    role:'user',
    parts:[{
        text:`
You are a legal visualization tool. You read a legal document and produce a small
set of charts that help a layperson understand its key obligations, deadlines,
costs and risks.

Return ONLY raw JSON. No markdown, no code fences, no commentary.

Exact output format:
{
  "type": "final",
  "visuals": [
    {
      "chart_type": "bar",
      "title": "Short chart title",
      "caption": "One line describing what this shows",
      "x": ["Label A", "Label B", "Label C"],
      "y": [10, 25, 40]
    }
  ]
}

Rules:
- "chart_type" MUST be one of exactly: "bar", "scatter", "line".
- "x" is an array of strings (labels, clause names, or dates).
- "y" is an array of NUMBERS only (amounts, days, or a 1-10 severity score).
- "x" and "y" MUST be the same length, and each needs at least 2 entries.
- Return 3 to 4 visuals maximum.
- Never include null, undefined, or non-numeric values in "y".
        `
    }]
}

// Normalises whatever the model returns into the flat trace shape the frontend
// renders. Guards against the model nesting values under "data" or using
// "visual_type", and drops anything that would make Plotly throw.
function normaliseVisuals(raw:any):any[]{
    const list = raw?.visuals || raw?.charts || []
    if (!Array.isArray(list)) return []

    const allowed:Record<string,string> = { bar:'bar', scatter:'scatter', line:'scatter' }

    return list.map((v:any) => {
        const src = v?.data && (v.data.x || v.data.y) ? v.data : v
        const rawType = String(v?.chart_type || v?.visual_type || 'bar').toLowerCase()
        return {
            chart_type: allowed[rawType] || 'bar',
            title: v?.title || '',
            caption: v?.caption || '',
            x: Array.isArray(src?.x) ? src.x : [],
            y: Array.isArray(src?.y) ? src.y.map(Number) : [],
        }
    }).filter((v:any) =>
        v.x.length > 1 &&
        v.y.length > 1 &&
        v.x.length === v.y.length &&
        v.y.every((n:any) => typeof n === 'number' && Number.isFinite(n))
    )
}

async function caller(query:any){
    const chat = model.startChat({ systemInstruction, history: [] })
    const out = await chat.sendMessage([query])
    const data = extractJson(out.response.text())
    return normaliseVisuals(data)
}

export async function charts(req:Request,res:Response){
    //fetching the data from redis
    const userId=res.locals.userId
    try {
        const data= await redis.get(`${userId}`)
        if(!data){
            res.status(202).json({data:'ISSUE WITH YOUR FILE REUPLOAD'})
            return
        }
        const obj=JSON.stringify({userId,reference:data})
        const out=await caller(obj)
        if(!out.length){
            res.status(200).json({data:[], error:'No chartable data could be extracted from this document.'})
            return
        }
        res.status(200).json({data:out})
    } catch (error:any) {
        console.error('[charts] failed:', error?.message || error)
        if (!res.headersSent) {
            res.status(500).json({ error: error?.message || 'Chart generation failed' })
        }
    }
}
