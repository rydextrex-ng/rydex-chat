// database.js
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://rydex:QN4y_*zm.cZFbj7@rydex.zte0w.mongodb.net/?retryWrites=true&w=majority&appName=Rydex'; 
const client = new MongoClient(uri);

async function connect() {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('Rydex'); 
}

module.exports = { connect };
