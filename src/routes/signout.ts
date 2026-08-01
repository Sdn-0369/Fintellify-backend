import {Request,Response} from 'express'

export async function signout(req:Request,res:Response){
    // With Bearer-token auth there is no server-side session or cookie to clear;
    // the client simply discards the token from localStorage. This endpoint is
    // kept for backward compatibility.
    res.status(200).send("Signout Successful")

}
