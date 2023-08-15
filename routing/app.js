const express = require('express')
const axios = require('axios')
const app = express()

app.use(express.json())

app.post('/', (req, res) => {
  console.log(req.body)  
  axios.post('http://localhost:3001/', req.body)
  .then(response => {
    console.log(response.data)
    res.status(200).json(response.data)
  })
  .catch(error => {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  })
})

app.get('/liveness', (req, res) => {
  res.status(200).json({alive: true})
})

const port = process.env.PORT || 3000

app.listen(3000, () => {
  console.log(`Simple API listening on port ${port}!`)
})