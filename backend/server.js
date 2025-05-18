require("dotenv").config();
const express = require('express');
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler")
const corsConfig = require("./config/corsConfig")

const app = express();
const PORT = 3500;

app.use(cors(corsConfig()));
app.use(express.json());




// Basic route
app.get('/', (req, res) => {
    res.send('<h1>Server is ON</h1>');
});
app.use('/appointment', require('./routes/route'))


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(errorHandler)

module.exports = app;