const express = require('express')
const axios = require('axios')
const app = express()
const CircuitBeaker = require('./circuit-breaker')

app.use(express.json())

const isVerbose = true;
const openThreshold = 1;
const timeout = 3000;

// We'll assume that this server doesn't stay down so we can just save to local memory.
let serverHits = 0;
let serverInfo = [
    // { url: 'http://localhost:3001/', state: CircuitBeaker.STATE.CLOSED, strikes: 0 },
    // { url: 'http://localhost:3002/', state: CircuitBeaker.STATE.CLOSED, strikes: 0 },
    // { url: 'http://localhost:3003/', state: CircuitBeaker.STATE.CLOSED, strikes: 0 },
]
const breaker = new CircuitBeaker.CircuitBeaker(serverInfo, {
  removeThreshold: 1,
  openStateRestTime: 20000,
  halfOpenStateInterval: 3000,
  timeout: timeout
});

app.get('/liveness', (_, res) => {
    res.status(200).json({alive: true})
  })
app.post('/', route)
app.post('/servers', addServer)
app.get('/servers', (_, res) => {
    res.status(200).json(serverInfo)
})

async function route(req, res) {
  // Problem with setting tries to length is that servers could've been added or removed.
  // Better to start with 0 and do the check based on serverInfo.length.
    if (res.tries === undefined) {
        res.tries = 0
    }
    console.log('start route')
    let server = serverInfo[serverHits % serverInfo.length];
    if (server === undefined) {
      res.status(503).json({ error: 'All servers down' })
      return;
    }
    while (server.state !== CircuitBeaker.STATE.CLOSED) {
      console.log(`${server.url} is ${server.state}`)
      res.tries++;
      if (res.tries >= serverInfo.length) {
        res.status(503).json({ error: 'All servers down' })
        return;
      }
      serverHits++;
      server = serverInfo[serverHits % serverInfo.length];
    }

    serverHits++;
    const baseURL = server?.url;
    const endpoint = req.body.path || '';
    const url = `${baseURL}${endpoint}`
  
    try {
      const response = await axios.post(url, req.body, { timeout })
      console.log(`From ${baseURL} and endpoint ${endpoint}`)
      response.data.server = isVerbose ? baseURL : undefined;
      res.status(200).json(response.data)
    } catch (error) {
      console.log(`From ${baseURL} and endpoint ${endpoint}`)
      const { code, message } = handleError(error)
      if (code >= 500) {
        res.tries++;
        server.strikes++;
        if (server.strikes >= openThreshold) {
          breaker.setToOpen(server)
        }
        if (res.tries < serverInfo.length) {
          route(req, res);
          return;
        }
      }
      const errorBody = { error: message }
      errorBody.server = isVerbose ? baseURL : undefined;
      res.status(code).json(errorBody);
    }
}

async function addServer(req, res) {
    let url = req.body.url;
    if (!url) {
        res.status(400).json({ error: 'Missing url' })
    }
    // To preserve order
    serverHits = serverHits % serverInfo.length
    serverHits = NaN ? 0 : serverHits;

    url = url.endsWith('/') ? url : `${url}/`;
    serverInfo.push({ url, state: CircuitBeaker.STATE.CLOSED, strikes: 0 })
    console.log(serverInfo);

    res.status(200).json({ success: true })
}

// For non-server errors, we just reflect what the original error was from the Simple API.
// For server errors, we return a `503` Service Unavailable because our Routing API is available. 
// We'll only return `503` and only if we've gone through all instances and they're all down.
function handleError(err) {
    // TODO: Fix error handling, it's tediously long in terminal as compared to debug console.
    console.error(err);
    const serviceError = { code: 503, message: 'Service Unavailable' };
    let code = err?.response?.status;
    if (code === undefined || code >= 500) {
        return serviceError
    }

    let message = err?.response?.data?.error;
    return { code, message }
}

const port = process.env.PORT || 3000

app.listen(3000, () => {
  console.log(`Simple API listening on port ${port}!`)
})