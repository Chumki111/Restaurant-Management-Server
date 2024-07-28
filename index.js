const express = require('express');
const app = express();
require('dotenv').config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middleware
const corsOption = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const client = new MongoClient(process.env.DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const foodCollection = client.db('Restaurant-Management').collection('foods');

    // collect top 6 foods
    app.get('/top-foods', async (req, res) => {
      const topFoods = await foodCollection.find().sort({ purchaseCount: -1 }).limit(6).toArray();
      res.send(topFoods);
    });

    // get all foods and search
    app.get('/all-foods', async (req, res) => {
      const search = req.query.search || '';
      const query = search ? { name: { $regex: search, $options: 'i' } } : {};
      const allFoods = await foodCollection.find(query).toArray();
      res.send(allFoods);
    });

    // get single food
    app.get('/all-foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensure the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
  res.send('Hello from restaurant server');
});

app.listen(port, () => {
  console.log(`Restaurant is running on ${port}`);
});
