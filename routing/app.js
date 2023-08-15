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

app.post('/', (req, res) => {
  const baseURL = serverURLs[serverHits % serverURLs.length];
  const url = `${baseURL}${req.body.path}`

  serverHits++;
  // TODO: Think about doing await for better readability.   
  axios.post(url, req.body)
  .then(response => {
    console.log(`From ${baseURL} and endpoint ${req.body.path}`)
    res.status(200).json(response.data)
  })
  .catch(error => {
    console.log(`From ${baseURL} and endpoint ${req.body.path}`)
    const { code, message } = handleError(error)
    res.status(code).json({ error: message })
  })
})

// For non-server errors, we just reflect what the original error was from the Simple API.
// For server errors, we return a `503` Service Unavailable because our Routing API is available. 
// It's just because its dependencies are not working temporarily.
// For unexpected errors, like ECONNRESET, we return a `500` Internal Server Error.
function handleError(err) {
    console.error(err);
    let code = err?.response?.status;
    if (code === undefined) {
        return { code: 500, message: 'Internal Server Error' };
    }

    let message = err?.response?.data?.error;
    code = code < 500 ? code : 503;
    message = code < 500 ? message : 'Service Unavailable';
    return { code, message }
}

app.get('/liveness', (req, res) => {
  res.status(200).json({alive: true})
})

const port = process.env.PORT || 3000

app.listen(3000, () => {
  console.log(`Simple API listening on port ${port}!`)
})