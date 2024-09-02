const express = require('express');
const bodyParser = require('body-parser');
const Fuse = require('fuse.js');
const { connect } = require('./database');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

let cachedData = {};

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
        return res.status(400).json({
            status: 400,
            rydex: "Parameter q is missing.",
            author: "Rydex"
        });
    }

    let response;

    if (cachedData[message] && cachedData[message].length > 0) {
        response = getRandomElement(cachedData[message]);
    } else {
        const keys = Object.keys(cachedData);
        const fuse = new Fuse(keys, { includeScore: true, threshold: 0.3 });
        const results = fuse.search(message);

        if (results.length > 0) {
            const bestMatch = results[0].item;
            const bestResponses = cachedData[bestMatch];
            if (bestResponses.length > 0) {
                response = getRandomElement(bestResponses);
            }
        }

        if (!response) {
            const randomKey = getRandomElement(keys);
            const randomResponses = cachedData[randomKey];
            response = getRandomElement(randomResponses);
        }
    }

    res.json({
        status: 200,
        rydex: response || "No response found at the moment.",
        author: "Rydex"
    });
});

app.post('/rydex/teach', async (req, res) => {
    const { q: key, a: value } = req.body;

    if (!key || !value) {
        return res.status(400).json({
            status: 400,
            rydex: "Missing parameters 'q' and 'a'.",
            author: "Rydex"
        });
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
        res.json({
            status: 200,
            rydex: "Rydex teached successfully.",
            author: "Rydex"
        });
    } catch (err) {
        console.error("Failed to update database:", err);
        res.status(500).json({
            status: 500,
            rydex: "Failed to save response. Please try again later.",
            author: "Rydex"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
