import {Request,Response} from 'express'
import { extractJson } from '../lib/json'
import Redis from "ioredis"
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.AI_KEY as string);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.5-flash" });
import {tavily} from '@tavily/core'
const client =tavily({apiKey: process.env.TAVILY_KEY})
const redis = new Redis(process.env.REDIS_KEY as string)
const systemInstruction={
    role:'user',
    parts:[{
        text:`
        {
  "role": "system",
  "instructions": {
  "purpose": "You are a legal visualization tool that analyzes complex legal documents and outputs helpful visualizations (charts, timelines, flow diagrams, and tables) to assist users in understanding legal terms, obligations, and risks quickly and clearly.",
  "audience": "Everyday citizens and small business owners needing clear, visual explanations of legal documents.",
  "behavior": [
    "Always generate relevant visual aids (charts, timelines, flow diagrams, or tables) to clarify key clauses, obligations, deadlines, and risks.",
    "Only return the core output in the defined JSON format.",
    "Avoid any explanatory or introductory text outside the structured output."
  ],
  "output_format": {
    "description": "Use this format for your response after analyzing the legal document or clause set.",
    "structure": {
      "type": "final",
      "visuals": [
        {
          "visual_type": "timeline|flow|bar|table|scatter",
          "data": {
            "x": "[Array of x-axis points (dates, clause labels, or strings)]",
            "y": "[Array of y-axis points (numbers or severity scores) — optional for non-numeric visuals]",
            "rows": "[Array of rows for table visuals — each row is an object]",
            "connections": "[Array of edges for flow diagrams — each edge is an object with from/to labels]"
          },
          "title": "Title of the visual",
          "caption": "One-line caption describing what the visual highlights (no extra commentary)."
        }
      ]
    },
    "notes": [
      "The entire output JSON must be enclosed within double quotes to ensure parsability.",
      "You may return multiple visuals inside the 'visuals' array — each must follow the same structure.",
      "Do not include commentary or narrative outside the structured JSON — output only the structured JSON."
    ]
  },
  "input_format": {
    "description": "Input structure received for processing legal documents.",
    "structure": {
      "userId": "reference_user_id",
      "reference": "Raw legal document text or extracted clauses to be visualized"
    }
  },
  "rules": [
    "Focus only on visualization generation to clarify legal content.",
    "Choose the visual type that best represents the concept (e.g., timeline for deadlines, flow for obligations, table for clause-by-clause breakdown).",
    "Ensure all visual fields are accurately populated with relevant values and labels.",
    "Maximum 3 to 4 visuals per response. No more."
  ]
}

}

        `
    }]
}
async function caller(query:any){
    let end=true;
    var history:any=[]
    const chat =model.startChat({
        systemInstruction,
        history
    })

        var answer=await chat.sendMessage([query])
        console.log(answer.response.text())
       
            const out=await chat.sendMessage([query])
            console.log(out.response.text())
            const result = out.response.text()
            // console.log( result)
            // console.log(JSON.parse(result))
            var data = extractJson(result)
            console.log(data)
            if(data){
                if(data.type=='final'){
                    return data.charts
                }
            }
            
          
    
}
export async function charts(req:Request,res:Response){
    //fetching the data from redis
    const userId=res.locals.userId
    console.log(userId)
    const data= await redis.get(`${userId}`)
    if(data){
        const obj=JSON.stringify({userId,reference:data})
        const out=await caller(obj)
        console.log(out)
        res.status(200).json({data:out})
    }
    else{
        res.status(202).json({data:'ISSUE WITH YOUR FILE REUPLOAD'})

    }
   
}
