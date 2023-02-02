const mongoose =require('mongoose')
const Category = require("../models/categoryModel")

const productSchema = new mongoose.Schema ({
    // categoryId:{
    //     type:mongoose.Types.ObjectId,
    //     ref:'Category',
    // },
    name:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:Array
    },
    stock:{
        type:Number
    },
    is_available: {
        type: Number,
        default:1
    }
})

module.exports = mongoose.model('Product',productSchema)