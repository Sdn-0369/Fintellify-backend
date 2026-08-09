import {Request,Response } from 'express'
import { extractJson } from '../lib/json'
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.AI_KEY as string);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.5-flash" });
import {tavily} from '@tavily/core'
const client =tavily({apiKey: process.env.TAVILY_KEY})
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_KEY as string);
const systemInstruction={
    role:'user',
    parts:[{
        text:`
        {
  "role": "system",
 "instructions": {  
  "purpose": "You are a legal tool tasked with simplifying complex legal documents into clear, accessible guidance for laymen.",  
  "behavior": [  
    "You analyze rental agreements, loan contracts, terms of service, or other legal documents.",  
    "You generate a story-based narrative (approx. 1000 words) to explain legal content in simple terms.",  
    "Ensure clarity, logical flow, and relevance — avoid technical jargon or unnecessary complexity."  
  ],  
  "response_format": {  
    "search_needed": {  
      "description": "Used when more real-time data or additional legal context is required before analysis can proceed.",  
      "example": {  
        "type": "search",  
        "question": "What is the latest amendment to tenancy laws in California?",  
        "end": true  
      }  
    },  
    "final_output": {  
      "description": "Used when the analysis is complete and ready to be shown to the user.",  
      "example": {  
        "type": "final",  
        "end": false,  
        "data": "Once upon a time, a tenant signed a lease filled with complex clauses. But when simplified, it clearly meant..."  
      }  
    },  
    "note": "Always wrap the entire output string — including JSON structure — within quotes for parsing reliability."  
  },  
  "input_format": {  
    "description": "Incoming user request structure you will receive.",  
    "example": {  
      "userId": "reference_user_id",  
      "data": "Raw legal text or document clauses to summarize",  
      "end": true  
    }  
  }  
}  

}

        `
    }]
}
async function caller(query:any){
    console.log('hi')
    let end=true;
    var history:any=[]
    const chat =model.startChat({
        systemInstruction,
        history
    })
     while(end){
        const out=await chat.sendMessage([query])
        console.log(out.response.text())
        const result = out.response.text()
       
        // console.log(JSON.parse(result))
        var data = extractJson(result)
      
        if(data){
          console.log('hi from data')
          if(data.type=='final'){
            end=data.end
            history=[...history,data]
            return data.data
            
          }
          else if(data.type=='search'){
            let answer=await client.search(query=`${data.question}`,{
              topic: "finance",
              includeImages: true,
              includeImageDescriptions: true
          })
          history=[...history,answer]
          
          }
        }
        else {
          // console.log("no fucking data ")
            return "Something is up"
          // const data =JSON.parse()
        }
      }
        
}
export async function analyzer(req:Request,res:Response){
     const data= (req.body);
     const userId=res.locals.userId
     try {
        console.log('hi from try')
       
          const out= await caller(JSON.stringify(data))
          console.log('data thrown')
           redis.set(`${userId}`,JSON.stringify(data.data),'EX',86400);
          res.json({data:out})
     } catch (error:any) {
        // Always send a response. Previously this only logged, so the request
        // hung forever and the frontend spinner never stopped.
        console.error('[analyzer] failed:', error?.message || error)
        if (!res.headersSent) {
          res.status(500).json({ error: error?.message || 'Analysis failed' })
        }
     }
     
}
