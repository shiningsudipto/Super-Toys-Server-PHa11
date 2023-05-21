const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json('Server IS Running')
})


const uri = `mongodb://${process.env.USER_NAME}:${process.env.SECRET_KEY}@ac-eh9wica-shard-00-00.kh5m3gl.mongodb.net:27017,ac-eh9wica-shard-00-01.kh5m3gl.mongodb.net:27017,ac-eh9wica-shard-00-02.kh5m3gl.mongodb.net:27017/?ssl=true&replicaSet=atlas-ixs7p9-shard-0&authSource=admin&retryWrites=true&w=majority`
// const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.SECRET_KEY}@cluster0.kh5m3gl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const toyCollection = client.db('superToys').collection('toys')
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // searching data with name field
        // const indexKeys = { name: 1 };
        // const indexOptions = { name: "toyName" };
        // const result = await toyCollection.createIndex(indexKeys, indexOptions);
        app.get('/toysName/:text', async (req, res) => {
            const searchText = req.params.text;
            const result = await toyCollection.find({
                $or: [
                    { name: { $regex: searchText, $options: "i" } }
                ]
            }).limit(20).toArray();
            res.json(result);
        })
        // getting all data
        app.get('/toys', async (req, res) => {
            const cursor = toyCollection.find().limit(20);
            const result = await cursor.toArray();
            res.json(result)
        })
        // getting data by email: http://localhost:5000/toysBy?email=ssudiptait@gmail.com
        // app.get('/toysBy', async (req, res) => {
        //     let query = {}
        //     if (req.query?.email) {
        //         query = {
        //             sellerEmail: req.query.email
        //         }
        //     }
        //     const result = await toyCollection.find(query).sort({ price: 1 }).toArray();
        //     res.json(result);
        // })
        // getting data by email and toggling asce desce by price
        app.get('/toysBy', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = {
                    sellerEmail: req.query.email
                };
            }
            let sortQuery = { price: 1 }; // Default sorting query (ascending order)
            if (req.query.sort === 'desc') {
                sortQuery = { price: -1 }; // If 'sort' query parameter is 'desc', change sorting query to descending order
            }
            const result = await toyCollection.find(query).sort(sortQuery).toArray();
            res.json(result);
        });


        // adding new toy
        app.post('/toys', async (req, res) => {
            const newToy = req.body;
            const result = await toyCollection.insertOne(newToy);
            res.json(result)
        })
        // update data
        app.put('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedToy = req.body;
            const toys = {
                $set: {
                    price: updatedToy.price,
                    availableQuantity: updatedToy.availableQuantity,
                    description: updatedToy?.description,
                }
            }
            const result = await toyCollection.updateOne(filter, toys, options)
            res.json(result)
        })
        // delete data
        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query);
            res.json(result);
        })

        // getting data by category
        app.get('/toys/:category', async (req, res) => {
            const { category } = req.params;
            const query = { category };
            const cursor = toyCollection.find(query).project({ name: 1, pictureUrl: 1, price: 1, rating: 1 });
            const result = await cursor.toArray();
            res.json(result);
        });
        // getting data by id
        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.json(result);
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



app.listen(port, () => {
    console.log(`server is running on port: ${port}`)
})