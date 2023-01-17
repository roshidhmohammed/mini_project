const mongoose = require('mongoose');
const User = require('../models/userModel');

const addressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,
        ref:'User',
    },
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    country:{
        type:String,
        required:true,
    },
    address1:{
        type:String,
        required:true,
    },
    address2:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true,
    },
    state:{
        type:String,
        required:true,
    },
    zip:{
        type:String,
        required:true,
    },
    mobno:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    }
})

module.exports = mongoose.model('Address',addressSchema);