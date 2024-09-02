const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI; // Your MongoDB URI
let db;

async function connect() {
    if (db) return db; // Return existing connection if available

    try {
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            tls: true // Ensure TLS/SSL is used for the connection
        });
        await client.connect();
        db = client.db('Rydex'); // Replace with your database name
        console.log('Connected to MongoDB');
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        throw err;
    }
}

module.exports = { connect };
