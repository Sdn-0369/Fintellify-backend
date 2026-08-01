import {Request,Response} from 'express'
import Redis from "ioredis"
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.AI_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
import {tavily} from '@tavily/core'
const client =tavily({apiKey: process.env.TAVILY_KEY})
const redis = new Redis(process.env.REDIS_KEY as string);
const systemInstruction={
    role:'user',
    parts:[{
        text:`{
  "role": "system",
  "instructions": {
  "purpose": "You are a legal tool chatbot that clarifies user questions based on initially provided legal documents or clauses.",
  "audience": "Everyday citizens and small business owners seeking clarity on legal terms, obligations, or risks.",
  "behavior": [
    "Always provide precise and descriptive answers.",
    "Keep responses paragraph-based, detailed, but not overly lengthy.",
    "Focus only on the core content — no introductions or framing."
  ],
  "output_format": {
    "search_needed": {
      "description": "Use this format if real-time data or external legal context is required to answer the user query.",
      "structure": {
        "type": "search",
        "question": "The legal or contextual question you need to look up to answer the user's query",
        "end": true
      },
      "note": "The returned answer will be appended to the conversation history for continued reasoning."
    },
    "final_output": {
      "description": "Use this format when the explanation is complete and sufficient legal data is available.",
      "structure": {
        "type": "final",
        "end": false,
        "data": "Your simplified and clear legal explanation in paragraph format"
      },
      "notes": [
        "The entire structured output must be wrapped in quotes to ensure parsing.",
        "Ensure the 'data' field contains a well-written paragraph(s) with simplified legal insights."
      ]
    }
  },
  "input_format": {
    "description": "Input you will receive per user query.",
    "structure": {
      "userId": "reference_user_id",
      "question": "question queried by the user",
      "reference": "legal text or clauses you will refer to",
      "end": true
    }
  },
  "rules": [
    "Never include introductory or explanatory phrases.",
    "Focus strictly on delivering informative and relevant legal answers.",
    "Prioritize clarity and simplification without omitting essential meaning."
  ]
}

}`
    }]
}
async function caller(query:any){
    let end=true;
    var history:any=[]
    const chat =model.startChat({
        systemInstruction,
        history
    })

        while(end){
            const out=await chat.sendMessage([query])
            // console.log(out.response.text())
            const result= (out.response.text().slice(7,out.response.text().length-3))
        console.log( result)
        // console.log(JSON.parse(result))
        var data=JSON.parse(result)
        console.log(data)
            if(data){
              if(data.type=='final'){
                end=data.end
                
                return data.data
                
              }
              else if(data.type=='search'){
                let answer=await client.search(query=`${data.question}`,{
                  topic: "finance",
                  includeImages: true,
                  includeImageDescriptions: true
              })
              query=JSON.stringify({question:data.question,answer:answer.results})
              }
            }
          
    }
}
export async function chatbot(req:Request,res:Response){
    //fetching the data from redis
    const userId=res.locals.userId
    console.log(userId)
    const data= await redis.get(`${userId}`)
    if(data){
        const question =req.body.question
        const end=true
        const obj=JSON.stringify({userId,reference:data,question,end})
        const out= await caller(obj)
        res.status(200).json({data:out})
    }
    else{
        res.status(202).json({data:'ISSUE WITH YOUR FILE REUPLOAD'})
    }

}
