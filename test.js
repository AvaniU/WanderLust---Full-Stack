require('dotenv').config(); // Make sure this is at the top

const mongoose = require('mongoose');
const dbURL = process.env.ATLASDB_URL;

console.log("DB URL: ", dbURL); // Debug log to see if the variable is being read correctly

mongoose.connect(dbURL)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((err) => {
        console.error("MongoDB connection error: ", err);
    });
