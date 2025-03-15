import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './utils/db.js'

//import routes
import userRoutes from './routes/user.routes.js'

dotenv.config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(
  cors({
    origin: process.env.BASE_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

const port = process.env.PORT || 3000

connectDB()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api/v1/users/', userRoutes)

app.listen(port, () => {
  console.log(`Server running on port: ${port}`)
})
