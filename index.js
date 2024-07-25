const express = require('express')
const app = express();
require('dotenv').config()
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt  = require("jsonwebtoken")
const port = process.env.port || 5000;

// middleware
const corsOption = {
    origin : ['http://localhost:5173', 'http://localhost:5174'],
    credentials : true,
    optionSuccessStatus:200
}
   
app.use(cors(corsOption));
app.use(express())
app.use(cookieParser())


const { MongoClient, ServerApiVersion } = require('mongodb');


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const foodCollection = client.db('Restaurant-Management').collection('foods');
    // collect top 6 foods
    app.get('/top-foods',async(req,res) =>{
      const topFoods = await foodCollection.find().sort({ purchaseCount: -1 }).limit(6).toArray();
      res.send(topFoods)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',async(req,res) =>{
  res.send('Hello from restaurant server')
})
app.listen(port,() =>{
  console.log(`Restaurant is running on ${port}`);
})
