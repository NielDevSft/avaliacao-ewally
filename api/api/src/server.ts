import app from './app'

require('dotenv').config();
const PORT = (process.env.SERVER_PORT  || 8080);

app.listen((PORT || 3002), async () => {
  console.log(`Express started at http://localhost:${PORT}`)
})
