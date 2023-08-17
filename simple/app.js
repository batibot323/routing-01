const express = require('express')
const app = express()
const axios = require('axios');

const port = process.env.PORT || 3000
let isBusy = false;
// Just affects `/` and `/liveness` route.

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

// Return `404`
app.post('/error', (_, res) => {
  console.log('visited error route')
  res.status(404).json({error: 'not found'});
})

// Return `500`
app.post('/internal-server-error', (_, res) => {
  console.log('visited internal-server-error route')
  res.status(500).json({error: 'discard this error for me.'});
})

// Return 200 but only after 15 seconds
app.post('/hang-15', (req, res) => {
  console.log('visited hang-forever route')
  setTimeout(() => {
    req.body.path = undefined
    res.status(200).json(req.body)
  }, 15000);
})

// Return 200 but only after 3 seconds
app.post('/hang-3', (req, res) => {
  console.log('visited hang-forever route')
  setTimeout(() => {
    req.body.path = undefined
    res.status(200).json(req.body)
  }, 3000);
})

// Restarts the server, doesn't "kill" it but it's close enough.
app.post('/restart', (_, res) => {
  console.log('visited restart route')
  init();
  res.status(200).json();
})

// This is to lock other paths compared to *hang* endpoints which still lets other requests in.
// Used to simulate `/liveness` endpoint being stuck.
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

// Simulates a server that is stuck but doesn't block other requests from coming in.
app.post('/hang-forever', (_, res) => {
  console.log('visited hang-forever route')
  res.status(200)
})

app.post('/flip', (_, res) => {
  let random = Math.random()
  console.log(`visited flip route: ${random}`)
  // Randomize whether to return 200 or 500, 50%
  if (random < 0.5) {
    req.body.path = undefined
    res.status(200).json(req.body)
  } else {
    res.status(500).json({error: 'discard this error for me.'});
  }
})

// Low-resource endpoint to check if server's still alive but not necessarily functioning properly.
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