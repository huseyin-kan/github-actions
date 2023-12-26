const mongoose = require('mongoose');
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URI

mongoose.connection.once('open',()=>{
    console.log('MongoDB connection ready');
})

mongoose.connection.on('error',(err)=>{
    console.log(err);
})

async function mongoConnect(){
    await mongoose.connect(MONGO_URI)
}

async function mongoDisconnect(){
    await mongoose.disconnect()
}

module.exports = {
    mongoConnect,
    mongoDisconnect
}