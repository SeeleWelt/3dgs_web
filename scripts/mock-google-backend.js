const express = require('express')
const cors = require('cors')
const request = require('request')

const app = express()
const PORT = process.env.PORT || 8787

app.use(cors())
app.use(express.json())

app.post('/auth/google/verify', (req, res) => {
  const credential = req.body && req.body.credential

  if (!credential) {
    return res.status(400).json({ message: 'Missing credential' })
  }

  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`

  request.get({ url, json: true, timeout: 8000 }, (err, response, body) => {
    if (err) {
      return res.status(502).json({ message: 'Google verify failed', error: err.message })
    }

    if (!response || response.statusCode !== 200) {
      return res.status(response?.statusCode || 500).json({
        message: body?.error_description || 'Invalid token',
        google: body
      })
    }

    const user = {
      name: body.name || body.email,
      email: body.email,
      picture: body.picture
    }

    res.json({
      token: `mock_${body.sub}`,
      user
    })
  })
})

app.listen(PORT, () => {
  console.log(`Mock Google auth server running at http://localhost:${PORT}`)
})
