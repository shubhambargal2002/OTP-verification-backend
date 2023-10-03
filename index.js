const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config()

// middlewares
app.use(express.json());
app.use(cors());

// database
require('./db')

// routes
app.use(require('./routes/auth'));

const port=process.env.PORT || 5000;

app.listen(port,()=>{
    console.log(`Otp-Verification server is listening at https://localhost:${port}`)
})