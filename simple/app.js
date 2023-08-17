const express = require('express')
const app = express()
const axios = require('axios');

const port = process.env.PORT || 3000
let isBusy = false;

app.use(express.json())

init();

app.post('/', (req, res) => {
  console.log(req.body)
  if (!isBusy) {
    res.status(200).json(req.body)
  } else {
    res.status(200)
  }
})

app.post('/error', (_, res) => {
  console.log('visited error route')
  res.status(404).json({error: 'not found'});
})

app.post('/internal-server-error', (_, res) => {
  console.log('visited internal-server-error route')
  res.status(500).json({error: 'discard this error for me.'});
})

app.post('/hang-15', (req, res) => {
  console.log('visited hang-forever route')
  setTimeout(() => {
    // TODO: Remove "path" in response
    res.status(200).json(req.body)
  }, 15000);
})

app.post('/restart', (_, res) => {
  console.log('visited restart route')
  init();
  res.status(200).json();
})

app.post('/deadlock', (_, res) => {
  console.log('visited deadlock route')
  isBusy = true;
  res.status(200)
})

app.post('/weird', (req, res) => {
  console.log(req.body)
  res.status(395).json(req.body)
})

app.post('/service-unavailable', (_, res) => {
  console.log('visited service-unavailable route')
  res.status(503).json({error: 'discard this error for me.'});
})

app.post('/hang-forever', (_, res) => {
  console.log('visited hang-forever route')
  res.status(200)
})

app.get('/liveness', (_, res) => {
  if (!isBusy) {
    res.status(200).json({alive: true})
  } else {
    res.status(503).json({alive: false})
  }
})

app.listen(port, () => {
  console.log(`Simple API listening on port ${port}!`)
})

function init() {
  isBusy = false;
  const myUrl = 'http://localhost:' + port;
  const routingUrl = 'http://localhost:3000/servers';
  try {
    axios.post(routingUrl, {url: myUrl});
  } catch (error) {
    console.error(`Error adding ${myUrl} to routing table.`)
  }
}