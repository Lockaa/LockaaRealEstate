const express = require('express');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let db;
client.connect((err) => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
  } else {
    db = client.db('zillowApp');
    console.log('Connected to MongoDB');
  }
});

app.use(express.json());

app.get('/api/search', async (req, res) => {
  const { zip, minPrice, maxPrice, minBeds, maxBeds, minBaths, maxBaths } = req.query;

  try {
    // Save search query to MongoDB
    const newSearchQuery = {
      zip,
      minPrice: parseInt(minPrice, 10),
      maxPrice: parseInt(maxPrice, 10),
      minBeds: parseInt(minBeds, 10),
      maxBeds: parseInt(maxBeds, 10),
      minBaths: parseInt(minBaths, 10),
      maxBaths: parseInt(maxBaths, 10),
      timestamp: new Date(),
    };
    await db.collection('searchQueries').insertOne(newSearchQuery);

    // Fetch data from Zillow API
    const response = await fetch(`https://api.zillow.com/v1/GetSearchResults.htm?zws-id=${process.env.ZILLOW_API_KEY}&zip=${zip}&price=$${minPrice}-${maxPrice}&bedrooms=${minBeds}-${maxBeds}&bathrooms=${minBaths}-${maxBaths}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/queries', async (req, res) => {
  try {
    const queries = await db.collection('searchQueries').find().sort({ timestamp: -1 }).limit(10).toArray();
    res.json(queries);
  } catch (error) {
    console.error('Error fetching search queries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});