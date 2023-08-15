const express = require('express')
const axios = require('axios')
const app = express()

app.use(express.json())

app.post('/', (req, res) => {
  console.log(req.body)
  const baseURL = 'http://localhost:3001/';
  const url = `${baseURL}${req.body.path}`
  axios.post(url, req.body)
  .then(response => {
    console.log(response.data)
    res.status(200).json(response.data)
  })
  .catch(error => {
    console.error(error)
    const { code, message } = handleError(error)
    res.status(code).json({ error: message })
  })
})

// TODO: Think about http code mapping
function handleError(err) {
    console.error(err);
    let code = err?.response?.status;
    if (code === undefined)
    return { code: 500, message: 'Internal Server Error' };
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