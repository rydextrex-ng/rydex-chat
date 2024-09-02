const express = require('express');
const bodyParser = require('body-parser');
const Fuse = require('fuse.js');
const { connect } = require('./database');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

let cachedData = {};

// Initialize connection and load cached data
connect().then(async (db) => {
    const responses = await db.collection('responses').find().toArray();
    responses.forEach(response => {
        cachedData[response.key] = response.values;
    });
    console.log('Cached data loaded:', cachedData);
}).catch(err => {
    console.error("Failed to connect to MongoDB or load data:", err);
});

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

app.get('/rydex/chat', async (req, res) => {
    const message = req.query.q;

    if (!message) {
        return res.status(400).send("Message query is required");
    }

    if (cachedData[message] && cachedData[message].length > 0) {
        const response = getRandomElement(cachedData[message]);
        return res.send(response);
    }

    const keys = Object.keys(cachedData);
    const fuse = new Fuse(keys, { includeScore: true, threshold: 0.3 });
    const results = fuse.search(message);

    if (results.length > 0) {
        const bestMatch = results[0].item;
        const bestResponses = cachedData[bestMatch];
        if (bestResponses.length > 0) {
            const response = getRandomElement(bestResponses);
            return res.send(response);
        }
    }

    const randomKey = getRandomElement(keys);
    const randomResponses = cachedData[randomKey];
    const randomResponse = getRandomElement(randomResponses);
    return res.send(randomResponse);
});

app.post('/rydex/teach', async (req, res) => {
    const { q: key, a: value } = req.body;

    if (!key || !value) {
        return res.status(400).send("Both 'q' and 'a' are required.");
    }

    if (!cachedData[key]) {
        cachedData[key] = [];
    }
    cachedData[key].push(value);

    try {
        const db = await connect();
        await db.collection('responses').updateOne(
            { key },
            { $set: { values: cachedData[key] } },
            { upsert: true }
        );
        res.send(`Thank you for teaching me!\nMessage: ${key}\nResponse: ${value}`);
    } catch (err) {
        console.error("Failed to update database:", err);
        res.status(500).send("Failed to save response. Please try again later.");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
