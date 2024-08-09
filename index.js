const express = require('express');
const app = express();
require('dotenv').config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

// verify token
const verifyToken = async(req,res,next) =>{
  const token = req.cookies?.token;
  if(!token){
 return res.status(401).send({message : 'unauthorized access'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message : 'unauthorized access'})
    }
    req.user = decoded;
    next()
  })

}

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
    const galleryCollection = client.db('Restaurant-Management').collection('gallery');
    const testimonialCollection=client.db('Restaurant-Management').collection('testimonials')
    const blogsCollection = client.db('Restaurant-Management').collection('blogs')
    const userCollection = client.db('Restaurant-Management').collection('users')

    // auth related api
    app.post("/jwt",async(req,res) =>{
      const user = req.body;
      console.log('I need a new user',user);
      const token  = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'365d'
      })
      res
      .cookie('token',token,{
   httpOnly:true,
   secure : process.env.NODE_ENV === 'production',
   sameSite : process.env.NODE_ENV === 'production' ? 'node' : 'strict'
      })
      .send({success : true})
    })
    // logout
    app.get('/logout',async(req,res) =>{
      try{
       res.clearCookie('token',{
        maxAge: 0,
        secure : process.env.NODE_ENV === 'production',
   sameSite : process.env.NODE_ENV === 'production' ? 'node' : 'strict'
       })
       .send({success : true})
       console.log('Logout successful');
      }catch(err){
        res.status(500).send(err)
      }
    })
    // save user or modify user email, status in db
    app.put('/users/:email',async(req,res) =>{
      const email = req.params.email;
      const user = req.body;
      const query = {email : email};
      const options = {upsert : true};
      const isExist = await userCollection.findOne(query);
      console.log('User found ---->',isExist);
      if(isExist) return res.send(isExist);
      const result  = await userCollection.updateOne(
        query,
        {
          $set : {...user,timestamp: Date.now()}
        },
        options
      )
      res.send(result)

    })
    // collect top 6 foods
    app.get('/top-foods', async (req, res) => {
      const topFoods = await foodCollection.find().sort({ purchaseCount: -1 }).limit(6).toArray();
      res.send(topFoods);
    });

    // get all foods and search
    app.get('/all-foods', async (req, res) => {
      const filter= req.query;
      const query ={ name: { $regex: filter.search, $options: 'i' } };
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

    // get all gallery image
   app.get('/gallery',async(req,res) =>{
    const result = await galleryCollection.find().toArray();
    res.send(result)
   })
  //  get all testimonial
  app.get('/testimonials',async(req,res) =>{
    const result = await testimonialCollection.find().toArray();
    res.send(result)
  })
  //  get all blogs
  app.get('/blogs',async(req,res) =>{
    const result = await blogsCollection.find().toArray();
    res.send(result)
  })
    // get single blog
    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
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
