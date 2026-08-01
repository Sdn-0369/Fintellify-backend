import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import {analyzer} from './routes/analyzer'
import {chatbot} from './routes/chatbot'
import {charts} from './routes/charts'
import {signin} from './routes/signin'
import {auth} from './middlewares/auth'
import {signout} from './routes/signout'

const app =express()

// Allowed frontend origins are provided via the FRONTEND_URL env var.
// It can be a single URL or a comma-separated list (useful for Vercel
// preview deployments). Falls back to the local Vite dev server.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser clients (curl, health checks) that send no origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  credentials: true,
}))


app.use(express.json({ limit: '10mb' }))

// simple health-check route for Railway / uptime checks
app.get('/', (req, res) => {
  res.status(200).send('OK')
})

//agent endpoints
app.post('/signin',signin)
app.post("/analyzer",auth,analyzer)
app.post("/chatbot",auth,chatbot)
app.get("/graphs",auth,charts)
app.get('/signout',signout)

const port = Number(process.env.PORT) || 4000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
