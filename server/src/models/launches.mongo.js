const mongoose = require('mongoose')

const launchesSchema = new mongoose.Schema({
    flightNumber:{
        type:Number,
        required:true,
        default:100
    },
    launchDate:{
        type:Date,
        required:true,
    },
    mission:{
        type:String,
        required:true,
    },
    rocket:{
        type:String,
        required:true,
    },
    target:{
        type:String,
    },
    upcoming:{
        type:Boolean,
        required:true,
    },
    success:{
        type:Boolean,
        required:true,
        default:true,
    },
    customers:[String]
})

module.exports = mongoose.model('Launch',launchesSchema)