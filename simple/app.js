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

app.post('/internal-server-error', (_, res) => {
  console.log('visited internal-server-error route')
  res.status(503).json({error: 'discard this error for me.'});
})

app.post('/hang-forever', (_, res) => {
  console.log('visited hang-forever route')
  res.status(200)
})

app.post('/hang-15', (req, res) => {
  console.log('visited hang-forever route')
  setTimeout(() => {
    res.status(200).json(req.body)
  }, 15000);
})

app.get('/liveness', (req, res) => {
  res.status(200).json({alive: true})
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Simple API listening on port ${port}!`)
})