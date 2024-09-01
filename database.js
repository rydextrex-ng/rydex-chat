// database.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI; 
const client = new MongoClient(uri);

async function connect() {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('Rydex'); 
}

module.exports = { connect };
