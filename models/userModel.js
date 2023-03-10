const mongoose = require('mongoose');
const Product = require("../models/productModel")
const Address = require("../models/addressModel")



const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
       
    },
    mobile:{
        type: String,
        required: true
    },
    
    password:{
        type: String,
        required: true,
    },

    confpassword: {
        type: String,
      
    },
    is_admin:{
        type: Number,
        required: true
    },
    is_verified:{
        type: Number,
        default:1
    },
    wallet:{
        type:Number,
        default:0
    },
    address:{
        details:[
            {
            addId:{
            type:mongoose.Types.ObjectId,
            ref:'Address'
            }
            }
        ]
    },
    cart:{
        item:[{
            productId:{
                type:mongoose.Types.ObjectId,
                ref:'Product',
                required:true
            },
            qty: {
                type:Number,
                required: true
            },
            price:{
                type:Number

            },
        }],
        totalPrice:{
            type:Number,
            default:0
        }
    },
    wishlist: {
        item: [
            {
                productId: {
                    type: mongoose.Types.ObjectId,
                    ref: "Product",
                    required:true

                },
                price:{
                    type:Number
                    
                }

            }],
       
    },

});

userSchema.methods.addToCart = function (product) {
    const cart = this.cart
    const isExisting = cart.item.findIndex(objInItems =>{
        return new String(objInItems.productId).trim() == new String(product._id).trim()   
    })
    if(isExisting >= 0) {
        cart.item[isExisting].qty +=1
    } else {
        cart.item.push({productId:product._id,
        qty:1,price:product.price})
    }
    cart.totalPrice += product.price
    console.log("User in schema:",this);
    return this.save()
}

userSchema.methods.removeFromCart = async function(productId) {
    const cart = this.cart
    const isExisting = cart.item.findIndex(objInItems => new String (objInItems.productId).trim() === new String(productId).trim())
    if(isExisting >=0){
        const prod = await Product.findById(productId)
        cart.totalPrice -= prod.price * cart.item[isExisting].qty
        cart.item.splice(isExisting,1)
        console.log("User in schema:",this);
        return this.save()
    }
}

userSchema.methods.addToWishlist = function (product)  {
    const wishlist = this.wishlist
    const isExisting = wishlist.item.findIndex(objInItems => {
         return new String(objInItems.productId).trim() == new String(product._id).trim()
    })
    if(isExisting >= 0){
        wishlist.item[isExisting].qty = 1
    } else {
        wishlist.item.push({productId:product._id,name: product.name,qty:1, 
        price:product.price})
    }
    console.log("User in Schema:", this)
    return this.save()
}

userSchema.methods.removeFromWishlist = async function (productId)  {
    const wishlist = this.wishlist
    const isExisting = wishlist.item.findIndex(objInItems => new String (objInItems.productId).trim() === new String(productId).trim())
    if(isExisting >=0) {
        const prod = await Product.findById(productId)
        wishlist.item.splice(isExisting,1)
        return this.save()
    }
}

module.exports = mongoose.model('User', userSchema);