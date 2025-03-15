import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

// eslint-disable-next-line no-undef
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server running on port: ${port}`)
})
