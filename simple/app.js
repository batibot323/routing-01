const express = require('express')
const app = express()

app.use(express.json())

app.post('/', (req, res) => {
  console.log(req.body)
  res.status(200).json(req.body)
})

app.post('/error', (_, res) => {
  console.log('visited error route')
  res.status(404).json({error: 'not found'});
})

app.get('/liveness', (req, res) => {
  res.status(200).json({alive: true})
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Simple API listening on port ${port}!`)
})