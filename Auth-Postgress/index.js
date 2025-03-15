import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'

//custom router
import userRegister from './routes/auth.route.js'

dotenv.config()
const port = process.env.PORT || 4000
const app = express()

app.use(cookieParser)
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  })
})

app.use('/api/v1/auth', userRegister)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
