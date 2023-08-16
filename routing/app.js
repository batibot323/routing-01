const express = require('express')
const axios = require('axios')
const app = express()
const { CircuitBreakerState } = require('./circuit-breaker')

app.use(express.json())

const isVerbose = true;
// We'll assume that this server doesn't stay down so we can just save to local memory.
let serverHits = 0;
// let serverURLs = [
//     'http://localhost:3001/',
//     'http://localhost:3002/',
//     'http://localhost:3003/'
// ];
let serverInfo = [
    { url: 'http://localhost:3001/', state: CircuitBreakerState.CLOSED, strikes: 0 },
    { url: 'http://localhost:3002/', state: CircuitBreakerState.CLOSED, strikes: 0 },
    { url: 'http://localhost:3003/', state: CircuitBreakerState.CLOSED, strikes: 0 },
]

app.get('/liveness', (_, res) => {
    res.status(200).json({alive: true})
  })
app.post('/', route)
app.post('/server-discovery', addServer)

async function route(req, res) {
    
    if (res.tries === undefined) {
        res.tries = serverInfo.length - 1;
    }
    console.log('start route')
    // TODO: Insert logic of finding a working server.
    const server = serverInfo[serverHits % serverInfo.length];
    const baseURL = server?.url;
    const endpoint = req.body.path || '';
    const url = `${baseURL}${endpoint}`
  
    serverHits++;
    try {
      const response = await axios.post(url, req.body, { timeout: 5000 })
      console.log(`From ${baseURL} and endpoint ${endpoint}`)
      response.data.server = isVerbose ? baseURL : undefined;
      res.status(200).json(response.data)
    } catch (error) {
      console.log(`From ${baseURL} and endpoint ${endpoint}`)
      const { code, message } = handleError(error)
      if (code >= 500 && res.tries > 0) {
        res.tries--;
        route(req, res);
      } else {      
        const errorBody = { error: message }
        errorBody.server = isVerbose ? baseURL : undefined;
        res.status(code).json(errorBody);
      }
    }
}

async function addServer(req, res) {
    let url = req.body.url;
    if (!url) {
        res.status(400).json({ error: 'Missing url' })
    }
    url = url.endsWith('/') ? url : `${url}/`;
    serverInfo.push({ url, state: CircuitBreakerState.CLOSED, strikes: 0 })
    console.log(serverInfo);

    // To preserve order
    serverHits = serverHits % serverInfo.length
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