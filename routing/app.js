const express = require('express')
const axios = require('axios')
const app = express()

app.use(express.json())

// We'll assume that this server doesn't stay down so we can just save to local memory.
let serverHits = 0;
let serverURLs = [
    'http://localhost:3001/',
    'http://localhost:3002/',
    'http://localhost:3003/'
];

app.post('/', route)

async function route(req, res, tries) {
    if (typeof tries !== 'number') {
        tries = serverURLs.length - 1;
    }
    console.log('start route')
    const baseURL = serverURLs[serverHits % serverURLs.length];
    const endpoint = req.body.path || '';
    const url = `${baseURL}${endpoint}`
  
    serverHits++;
    try {
      const response = await axios.post(url, req.body)
      console.log(`From ${baseURL} and endpoint ${endpoint}`)
      res.status(200).json(response.data)
    } catch (error) {
      console.log(`From ${baseURL} and endpoint ${endpoint}`)
      const { code, message } = handleError(error)
      if (code >= 500 && tries > 0) {
        route(req, res, tries-1);
      } else {
        res.status(code).json({ error: message })
      }
    }
}

// For non-server errors, we just reflect what the original error was from the Simple API.
// For server errors, we return a `503` Service Unavailable because our Routing API is available. 
// We'll only return `503` and only if we've gone through all instances and they're all down.
function handleError(err) {
    console.error(err);
    const serviceError = { code: 503, message: 'Service Unavailable' };
    let code = err?.response?.status;
    if (code === undefined || code >= 500) {
        return serviceError
    }

    let message = err?.response?.data?.error;
    return { code, message }
}

app.get('/liveness', (req, res) => {
  res.status(200).json({alive: true})
})

const port = process.env.PORT || 3000

app.listen(3000, () => {
  console.log(`Simple API listening on port ${port}!`)
})