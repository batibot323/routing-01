const express = require('express')
const app = express()
const axios = require('axios');

const port = process.env.PORT || 3000

app.use(express.json())

init();

app.post('/', (req, res) => {
  console.log(req.body)
  res.status(200).json(req.body)
})

app.post('/weird', (req, res) => {
  console.log(req.body)
  res.status(395).json(req.body)
})

app.post('/error', (_, res) => {
  console.log('visited error route')
  res.status(404).json({error: 'not found'});
})

app.post('/internal-server-error', (_, res) => {
  console.log('visited internal-server-error route')
  res.status(500).json({error: 'discard this error for me.'});
})

app.post('/service-unavailable', (_, res) => {
  console.log('visited service-unavailable route')
  res.status(503).json({error: 'discard this error for me.'});
})

app.post('/hang-forever', (_, res) => {
  console.log('visited hang-forever route')
  res.status(200)
})

app.post('/hang-15', (req, res) => {
  console.log('visited hang-forever route')
  setTimeout(() => {
    // TODO: Remove "path" in response
    res.status(200).json(req.body)
  }, 15000);
})

app.get('/liveness', (req, res) => {
  res.status(200).json({alive: true})
})

app.listen(port, () => {
  console.log(`Simple API listening on port ${port}!`)
})

// const secondPort = process.env.PORT_TWO || 5000
// app.listen(secondPort, () => {
//   console.log(`Simple API listening on port ${secondPort}!`)
// })

function init() {
  const myUrl = 'http://localhost:' + port;
  const routingUrl = 'http://localhost:3000/servers';
  axios.post(routingUrl, {url: myUrl});
}