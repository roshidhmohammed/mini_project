const User = require('../models/userModel');
const Product = require('../models/productModel');
const Orders = require('../models/ordersModel');
const Address = require('../models/addressModel')
const Offer = require('../models/offerModel')
const Category = require('../models/categoryModel')
const Banner = require("../models/bannerModel");
const bcrypt = require('bcrypt');
const fast2sms =require("fast-two-sms");
const RazorPay = require('razorpay');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
// const user_route = require('../routes/userRoute');



const cors = require('cors')
const express = require('express')
const app = express()
app.use(express())
app.use(cors())

let isLoggedin
isLoggedin = false
let userSession = null || {}
const {ObjectID} = require("bson")
let newUser
let newOtp
let offer = {
    name:'None',
    type:'None',
    discount:0,
    minimumBill:'None',
    usedBy:false
}
let couponTotal = 0
let currentOrder


const securePassword = async (password) => {

    try {
         const passwordHash = await bcrypt.hash(password, 10);
         return passwordHash;
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async(req,res) => {
    try {

        res.render('login');

    } catch(error) {
        console.log(error.message);
    }
}
const sendMessage = function(mobile,res){
    let randomOTP = Math.floor(Math.random()*10000)
    var options = {
        authorization:process.env.API_KEY,
        message:`your OTP verification code is ${randomOTP}`,
        numbers:[mobile]
    }
    //send this message
    fast2sms.sendMessage(options)
    .then((response)=>{
        console.log("otp sent successfully")
    }).catch((error)=>{
        console.log(error)
    })
    return randomOTP;
}



const loadOtp = async(req,res)=>{
    const userData = await User.findById({_id:newUser})
    const otp = sendMessage(userData.mobile,res)
    newOtp = otp
    console.log('otp:',otp);
    res.render('../otpVerify',{otp:otp,user:newUser})
}

const verifyOtp = async(req,res)=>{
    try{
        const otp = newOtp
        const userData = await User.findById({_id:req.body.user})
        if(otp == req.body.otp){
            userData.is_verified = 1
            const user = await userData.save()
            if(user){
                res.redirect('/login')
            }
        }else{
            res.render('../otpVerify',{message:"Invalid OTP"})
         }
    
        } catch(error){
            console.log(error.message)
         }
        }

const insertUser = async (req,res) =>{
    
    
    try{
        const spassword = await securePassword(req.body.password);
        console.log(req.body.name)
        const user = new User({
            name: req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            password:spassword,
            //confpassword:password,
            is_admin:0,
            is_verified:0

        });
        const userData = await user.save();
        newUser = userData._id
        if(userData){
            res.redirect('/verifyOtp');
        }
        else {
            res.render('registration', {message:"your registration has been failed."});    
        }

    } catch(error) {
        console.log(error.message);
    }
}


const userForgotPassword = async (req, res) => {
    try {
      userSession = req.session
      if (userSession.userId) {
        const userData = await User.findById({ _id: userSession.userId })
        if (userData.is_verified === 1) {
          res.render('home',userData)
        } else {
          res.render('login')
        }
      } else {
        res.render('forgotpassword', { isLoggedin: false, forgotpassword: true, checkuser: false, otp: false, user: false, changepassword: false })
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const checkUser = async (req, res) => {
    try {
      userSession = req.session
      if (userSession.userId) {
        res.render('home')
      } else {
        const email = req.body.email
        userEmail = email
        const userDataOne = await User.findOne({ email: email })
        userOne = userDataOne
        if (userDataOne) {
          const otp = sendMessage(userDataOne.mobile, res)
          newOtp = otp
          console.log('otp:', otp)
          res.render('forgotpassword', { isLoggedin: false, forgotpassword: false, checkuser: true, otp: false, user: false, changepassword: false })
        } else {
          res.render('forgotpassword', { isLoggedin: false, forgotpassword: true, checkuser: false, otp: false, user: false, message: 'User not found', changepassword: false })
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const sentOtp = async (req, res) => {
    try {
      userSession = req.session
      if (userSession.userId) {
        res.render('home')
      } else {
        const otp = newOtp
        console.log(otp)
        const userData = req.body.user
        const otpBody = req.body.otp
        if (otpBody == otp) {
          res.render('forgotpassword', { isLoggedin: false, forgotpassword: false, checkuser: false, otp: true, user: userData, changepassword: true })
        } else {
          res.render('forgotpassword', { isLoggedin: false, forgotpassword: false, checkuser: true, otp: false, user: userData, changepassword: false, message: 'Invalid Otp' })
  
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const changepassword = async (req, res) => {
    try {
      userSession = req.session
      if (userSession.userId) {
        res.render('home')
      } else {
        const password1 = req.body.password1
        const password2 = req.body.password2
        const user = userEmail
        console.log('userEmail: ' + user)
        if (password1 === password2) {
          const sPassword = await securePassword(password1)
          const userData = await User.findOneAndUpdate({ email: user }, {
            $set: {
              password: sPassword
            }
          })
          if (userData) {
            res.redirect('login')
          }
        } else {
          res.render('forgotpassword', { isLoggedin: false, forgotpassword: false, checkuser: true, otp: false, user: userData, changepassword: false, message: 'Passwords mismatch' })
        }
      }
    } catch (error) {
      console.log(error.message)
    }
  }
  


//login user methods started

const loginLoad = async(req,res) => {
    try {
        res.render('login');
    } catch(error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

       const userData = await User.findOne({email: email});

       if(userData) {
        const passwordMatch = await bcrypt.compare(password,userData.password);

        if(passwordMatch) {
            if(userData.is_verified == 0) {
                res.render('login', {message: "you are blocked."});

            }
            else {
                if(userData.is_admin === 1) {
                    res.render("login",{message:"Not user"});
                } else {
                    userSession = req.session
                    userSession.userId = userData._id
                    isLoggedin = true
                    res.redirect('/view-product');
                    console.log("login")
                }
            }

        }else {
            res.render('login', {message: "email and password is incorrect"});
        }


       }
       else {
        res.render('login', {message:"Email and password is incorrect"});
        
       }
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadHome  = async(req,res) => {
    try {
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        const banner = await Banner.find({ is_active: 1 });
        userSession.offer = offer
        userSession.couponTotal = couponTotal
        const productData = await Product.find()
    

        res.render('view-product',{isLoggedin,productshop:productData, id:userSession.userId,banners: banner,user:userData});
    } catch (error) {
        console.log(error.message);
    }

}

const currentBanner = async (req, res) => {
    try {
      const id = req.query.id;
      await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } });
      await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } });
      res.redirect("/admin/loadBanners");
    } catch (error) {
      console.log(error.message);
    }
  };

const userLogout = async (req,res) => {
    try {
        userSession = req.session
        userSession.userId= null
        isLoggedin = false
        console.log("logged out");

        res.redirect('/login');
        
    } catch (error) {
        console.log(error.message);
    }

}

const usershop = async (req,res) => {
    try {
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        const id = req.session.userId;
        const category = await Category.find({is_available:0})
        // const productshop = await Product.find({is_available:1})
        let search = ''
    if (req.query.search) {
      search = req.query.search
    }
    let page = 1
    if (req.query.page) {
      page = req.query.page
    }
    const limit = 4
    const productData = await Product.find({
      is_available: 1,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    const count = await Product.find({
      is_available: 1,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    }).countDocuments()

    const categoryData = await Category.find({is_available: 1})
    const ID = req.query.id
    // console.log(categoryData)
    const data = await Category.findOne({ _id: ID })
        
        // const productData = await Product.find()
        if (data) {
            const productData = await Product.find({ category: data.name })
            console.log(productData)
            res.render('shop', {
              productshop: productData,
              isLoggedin,
              cat: categoryData,
              totalPages: Math.ceil(count / limit),
              currentPage: page,
              previous: new Number(page) - 1,
              next: new Number(page) + 1
            })
          } else {
            // const productData = await Product.find()
            res.render('shop', {
              isLoggedin,
              cat: categoryData,
              productshop: productData,
              id: userSession.userId,
              totalPages: Math.ceil(count / limit),
              currentPage: page,
              category,
            //   categoryData,
            //   id:userSession.userId,
              previous: new Number(page) - 1,
              next: new Number(page) + 1,
              user:userData
            })
          }

       
        
        
        
    } catch (error) {
        console.log(error.message)
        
    }
}


const getCategoryProduct = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userData = await User.find({ _id: userId });
        const category = req.query.category;
        const categoryData = await Category.find();
        const productshop = await Product.find({ category: category });
        console.log(productshop);
        res.render("categoryProduct", { categoryData, productshop, category, user:userData });
    } catch (error) {
        console.log(error.message);
    }
}

const productDetail  =async (req,res) =>{
    try {
        userSession= req.session
        const userData = await User.findById({_id:userSession.userId})
        const id = req.query.id
        const products = await Product.find()
        const productData = await Product.findById({_id:id}).exec(async function(err,productData){;
        if (productData) {
            res.render('product-detail',{isLoggedin,product:productData,products:products,userSession:userSession.userId,user:userData})
        } else if(err){
            res.redirect('*')
        }   
    })
    } catch (error) {
        console.log(error.message)
    }
}

const userProfile = async (req,res) =>{
    try {
        const orderData = await Orders.find({userId:userSession.userId})
        const userData = await User.findById({_id:userSession.userId})
        const addressData = await Address.findById({_id:userSession.userId})
        console.log(addressData)
        res.render('dashboard',{isLoggedin,user:userData,userOrders:orderData,userAddress:addressData})     
    } catch (error) {
        console.log(error.message)
        
    }
}

const userOrders = async (req,res) =>{
    try {
        const orderData = await Orders.find({userId:userSession.userId})
        const userData = await User.findById({_id:userSession.userId})
        res.render("orders",{order:orderData,user:userData})
    } catch (error) {
        console.log(error.message)
    }
}

const cancelOrder = async (req,res) => {
    try {
        userSession = req.session
        if(userSession.userId){
            const id = req.query.id
            const orderData = await Orders.findById({_id:id})
        if(orderData.payment === "Razorpay"){
        
        const orderDelete  = await Orders.findByIdAndUpdate({_id:id},{$set:{status:"Cancelled"}})
        
        const userData = await User.findByIdAndUpdate({_id:userSession.userId},{$set:{wallet:orderData.amount}})
        // if(orderData.payment === "RAZORPAY"){
        //     res.redirect('/wallet')
        // }else  {
            await orderDelete.save()
            await userData.save()
            console.log(orderData.payment)
        res.redirect('/orders')
        // res.render('wallet',{ordersDelete:orderDelete,order:orderData,user:userData})
        } else{
            const id = req.query.id
        const orderDelete  = await Orders.deleteOne({_id:id})
        // const orderData = await Orders.findById({_id:id})
        // await orderDelete.save()
            res.redirect('/orders')
        }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
        
    }
}

const wallet = async(req,res) => {
    try {
        userSession = req.session
        if(userSession.userId){
        const id = req.query.id
        // const orderDelete  = await Orders.findByIdAndUpdate({_id:id},{$set:{status:"Cancelled"}})
        // const orderData = await Orders.findById({_id:id})
        // // console.log(orderData)
        // const userData = await User.findById({_id:userSession.userId})
        // console.log(orderData[0].payment)
        // console.log(userData[0].wallet)
        // if(orderData.payment === "COD"){
            // res.render('wallet',{user:userData,order:orderData,orderDelete})
        // }else  {
        // res.redirect('/orders')
        // }
        // const id = req.query.id
        const orderData = await Orders.find()
        const userData = await User.findByIdAndUpdate({_id:userSession.userId},{$set:{wallet:orderData.amount}})
        // await userData.save()
        res.render('wallet',{user:userData})
        } else {
            res.redirect('/login')
        }
        }
     catch (error) {
        console.log(error.message)
    }
}


const viewOrderDetail = async (req,res) =>{
    try {
        userSession = req.session
        if(userSession.userId) {
            const id = req.query.id
            userSession.currentOrder = id
            const orderData = await Orders.findById({_id:id})
            const userData = await User.findById({_id:userSession.userId})
            await orderData.populate('products.item.productId')
            res.render('orderProductDetail',{order:orderData,user:userData,couponTotal:userSession.couponTotal,offer:userSession.offer})
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
    }
}
const addAddress = async (req,res) =>{
    try {
        const userData = await User.findById({_id:userSession.userId})
        res.render('address',{user:userData})
    } catch (error) {
        console.log(error.messsage)
    }
}
const updateAddress = async (req,res) =>{
    try {
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        const addressData = Address({
            userId:userSession.userId,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            country: req.body.country,
            address1:req.body.address1,
            address2:req.body.address2,
            city:req.body.city,
            state:req.body.state,
            zip:req.body.zip,
            mobno:req.body.mobno,
            email:req.body.email
        })
        // console.log("address:" +addressData)
        await addressData.save()
        res.redirect('/address')
        // res.render('address',{address:addressData,user:userData})
    } catch (error) {
        console.log(error.message)    
    }
}

const deleteAddress = async (req, res) => {
    try {
      userSession = req.session;
      id = req.query.id;
      console.log(id);
      await Address.findByIdAndDelete({ _id: id });
      res.redirect("/checkout");
    } catch (error) {
      console.log(error.message);
    }
  };

const editUser = async (req,res) =>{
    try {
        const id = req.query.id
        
        // userSession = req.session;
        const userData  = await User.find({_id:id})
        const userDatas  = await User.findById({_id:userSession.userId})
        // await User.findByIdAndUpdate(
            
        //     { _id: userSession.userId },
        //     {
        //       $set: {
        //         name: req.body.name,
        //         email: req.body.email,
        //         mobile: req.body.mobno,
        //       },
        //     }
        //   );
          
        res.render('edit-user',{users:userData,user:userDatas})
    } catch (error) {
        console.log(error.message)
        
    }
}
const updateUser = async (req,res) =>{
    try {
        userSession = req.session;
        const userData  = await User.find({_id:userSession.userId})
        const productData = await User.findByIdAndUpdate({_id:userSession.userId},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mobno}})
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error.message)
        
    }
}



const loadCart = async (req,res) =>{
    
    try {
        userSession = req.session
        if(userSession.userId) {            
            const userData = await User.findById({_id:userSession.userId})
            const completeUser = await userData.populate('cart.item.productId')
            // const offerData = await Offer.find()
            // if(userSession.couponTotal == 0) {
            //     userSession.couponTotal = userData.cart.totalPrice
            // }
            
            res.render('cart',{isLoggedin,id:userSession.userId,cartProducts:completeUser.cart,offer:userSession.offer,couponTotal:userSession.couponTotal,user:userData})
        } else {
            res.render('cart',{isLoggedin,id:userSession.userId,offer:userSession.offer,couponTotal:userSession.couponTotal})
        }
         
    } catch (error) {
        console.log(error.message)
    }
}

const addToCart = async(req,res,next) =>{
    try {
        console.log("cart working")

        const productId = req.query.id
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        const productData = await Product.findById({_id:productId})
        userData.addToCart(productData)
        res.redirect('/cart')
} catch (error) {
    console.log("cart not working")
        console.log(error.message)
}

}

const deleteCart = async (req,res,next) =>{
    
    try {   
        const productId = req.query.id
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        userData.removeFromCart(productId)
        res.redirect('/cart')
    } catch (error) {
        console.log(error.message);        
    }
}

// const editQty = async (req,res) =>{
//     try {
//         id = req.query.id
//         // console.log(id,":",req.body.qty)
//         userSession = req.session
//         const userData = await User.findById({id:userSession.userId})
//         const foundProduct = userData.cart.item.findIndex(objInItems => objInItems._id == id)
//         // console.log('product found at:',foundProduct)

//         userData.cart.item[foundProduct].qty = req.body.qty
//         // console.log(userData.cart.item[foundProduct]);
//         userData.cart.totalPrice = 0

//         const totalPrice = userData.cart.item.reduce((acc,curr) => {
//             return acc+(curr.price*curr.qty)
//         },0)

//         userData.cart.totalPrice = totalPrice
//         await userData.save()

//         res.redirect('/cart')
        
//     } catch (error) {
//         console.log(error.message)
        
//     }
// }

const changeProductQnty = async (req, res) => {
    try { 
        const id = req.query.id;
        console.log(id);
        const userData = await User.findById({ _id: req.session.userId });
      console.log(userData);
      console.log("dfgg");
        const foundProduct = userData.cart.item.findIndex((x) => x.productId == id);
        console.log(foundProduct);
        const qty = { a: parseInt(req.body.qty) };
        console.log(qty);
        
        userData.cart.item[foundProduct].qty = qty.a;
        console.log("jhg");
        const price = userData.cart.item[foundProduct].price;
        userData.cart.totalPrice = 0;
  
        const totalPrice = userData.cart.item.reduce((acc, curr) => {
            return acc + curr.price * curr.qty;
        }, 0);
        userData.cart.totalPrice = totalPrice;
        await userData.save();
        res.json({ totalPrice, price });
    } catch (error) {
        console.log(error.message);
    }
  };

const loadCheckout = async (req,res) => {
    try {
        const userSession = req.session
        if(userSession.userId) 
        {   
            const id = req.query.addressid      
            const userData = await User.findById({_id: userSession.userId})
            const completeUser = await userData.populate('cart.item.productId')
            const addressData = await Address.find({userId:userSession.userId})
            console.log("user:" +addressData)
            const selectAddress = await Address.findOne({_id:id})
            console.log("address:" + selectAddress)
            const offerData = await Offer.find()
            if(userSession.couponTotal == 0) {
                userSession.couponTotal = userData.cart.totalPrice
            }
            res.render('checkout',{isLoggedin,id: userSession.userId,cartProducts:completeUser.cart,userAddress:addressData,updateAddress:selectAddress,offers:offerData,offer:userSession.offer,couponTotal:userSession.couponTotal,user:userData})
        } else {
            res.render('/',{isLoggedin,id:userSession.userId,offer:userSession.offer,couponTotal:userSession.couponTotal})
        }
    } catch (error) {
        console.log(error.message)
        
    }
}

const storeOrder = async (req,res) =>{
    try {
        userSession = req.session
        if(userSession.userId) {
            const userData = await User.findById({_id:userSession.userId})
            const completeUser = await userData.populate('cart.item.productId')
            // const completeOrder = await Orders.populate('products.totalPrice')

            const updatedTotal = await userData.save()

            if(completeUser.cart.totalPrice>0){
                const order = Orders({
                    userId:userSession.userId,
                    firstname:req.body.firstname,
                    lastname:req.body.lastname,
                    mobno:req.body.mobno,
                    email:req.body.email,
                    payment: req.body.payment,
                    country: req.body.country,
                    address1: req.body.address1,
                    address2: req.body.address2,
                    city: req.body.city,
                    state: req.body.state,
                    zip:req.body.zip,
                    products:completeUser.cart,
                    discount:userData.cart.totalPrice-userSession.couponTotal,
                    amount:userSession.couponTotal
                })
                let orderProductStatus = []
                for(let key of order.products.item) {
                    orderProductStatus.push(0) 
                }
                const orderData = await order.save()
                userSession.currentOrder = orderData._id
                currentOrder = orderData._id
                // console.log(currentOrder)
                const offerUpdate = await Offer.updateOne({name:userSession.offer.name},{$push:{usedBy:userSession.userId}})
                if(req.body.payment == 'COD') {
                    res.redirect('/orderSuccess')
                } else if(req.body.payment == 'Razorpay') {
                    res.render('razorpay',{userId:userSession.userId,total:completeUser.cart.totalPrice,user:userData,offer:userSession.offer,offerUpdate,order:orderData})
                } else if(req.body.payment == 'paypal'){
                    res.render('paypal',{userId:userSession.userId,total:completeUser.cart.totalPrice,user:userData})
                } else {
                    res.redirect('/checkout')
                }
            } else {
                res.redirect('/checkout')
        } 

          
        }
        else {
            res.render('/checkout')
        }
    }  
        
     catch (error) {
        console.log(error.message)
        
    }
}

const loadSuccess = async (req,res) =>{
    try {
        userSession = req.session
        if(userSession.userId) {
            const userData = await User.findById({_id:userSession.userId})
            const  productData = await Product.find()
            for(let key of userData.cart.item){
                console.log(key.productId, '+', key.qty)
                for(let prod of productData) {
                    if(new String(prod._id).trim() == new String(key.productId).trim()){
                        prod.stock = prod.stock-key.qty
                        await prod.save()
                    }
                }
            }
            await Orders.find({
                userId : userSession.userId
            })
            await Orders.updateOne({userId:userSession.userId,_id:userSession.currentorder},{$set:{'status':'built'}})
            await User.updateOne({_id:userSession.userId},{$set:{'cart.item':[],'cart.totalPrice':'0'}},{multi:true})
            console.log(userData.cart)
            console.log('order Built and cart is empty')
            userSession.couponTotal = 0
        res.render('orderSuccess',{orderId:userSession.currentOrder,user:userData})
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message)
    }
}


const loadWishlist = async (req,res) =>{
    try {
        userSession = req.session
        if(userSession.userId) {
            const userData = await User.findById({_id:userSession.userId})
            const completeUser = await userData.populate('wishlist.item.productId')
            console.log(completeUser.wishlist.item)
            res.render('wishlist',{isLoggedin,id:userSession.userId,wishlistProducts:completeUser.wishlist,user:userData})
        } else {
            res.render('wishlist',{isLoggedin,id:userSession.userId})
        }
    } catch (error) {
        console.log(error.message)
        
    }
}

const addToWishlist = async (req,res) => {
    try {
        const productId = req.query.id;
        userSession = req.session;
        if(userSession.userId){
        const userData = await User.findById({_id:userSession.userId})
        const productData = await Product.findById({_id:productId})
        console.log("userData ===" + userData)
        console.log("productdata ===" + productData)
        userData.addToWishlist(productData)
        res.redirect('/wishlist')
        }else{
            res.redirect('/login')
        }
        
    } catch (error) {
        console.log(error.message)    
    }
}

const addCartDeleteWishlist = async (req,res) =>{
    try {
        const productId = req.query.id
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        const productData  =await Product.findById({_id:productId})
        const add = await userData.addToCart(productData)
        if(add) {
            userData.removeFromWishlist(productId)
        }
        res.redirect('/cart')
        
    } catch (error) {
        console.log(error.message)
        
    }
}

const deleteWishlist = async (req,res) => {
    try {
        const productId = req.query.id
        userSession = req.session
        const userData = await User.findById({_id:userSession.userId})
        userData.removeFromWishlist(productId)
        res.redirect('/wishlist')
        
    } catch (error) {
        console.log(error.message)
        
    }
}

const razorpayCheckout = async(req,res)=>{
    userSession = req.session
    const userData =await User.findById({ _id:userSession.userId })
    const completeUser = await userData.populate('cart.item.productId')
    var instance = new RazorPay({ key_id:process.env.key_id, key_secret:process.env.key_secret})
    console.log(req.body);
    console.log(completeUser.cart.totalPrice);
                let order = await instance.orders.create({
                  amount: completeUser.cart.totalPrice*100,
                  currency: "INR",
                  receipt: "receipt#1",
                })
                res.status(201).json({
                    success: true,
                    order
                })
  }

const addCoupon = async (req,res) =>{
    try {
        userSession = req.session
        console.log("coupon starting")
        if(userSession.userId) {

            console.log('user id '+userSession.userId)
            const userData = await User.findById({_id:userSession.userId})
            const offerData = await Offer.findOne({name:req.body.offer})
            
            // console.log(userData.cart.totalPrice)
            // console.log(offerData.minimumBill)
            
            // let offername = req.body.offer
            // console.log("coupon name :"+ offername)
            // console.log(offerData)
            if(offerData){
                // console.log(offerData)
                // console.log(offerData.usedBy)

                if(offerData.usedBy.includes(userSession.userId)) {
                    // console.log("coupon not used")
                    // console.log('user:',userSession)
                    console.log("coupon already used")
                    userSession.offer.usedBy = true

                    let updatedTotal = userData.cart.totalPrice
                    userSession.couponTotal = updatedTotal
                    // couponTotal = updatedTotal
                    
                    console.log("nocoupon" + couponTotal)
                    res.redirect('/checkout')
                    

                } else {
                    userSession.offer.name = offerData.name
                    userSession.offer.type  = offerData.type
                    userSession.offer.discount  = offerData.discount
                    userSession.offer.minimumBill = offerData.minimumBill

                    // if(userData.cart.totalPrice>=offerData.minimumBill) {
                    let updatedTotal = userData.cart.totalPrice - (userData.cart.totalPrice*userSession.offer.discount)/100
                    // console.log("minimumbill checking")

                    userSession.couponTotal = updatedTotal

                    // couponTotal = updatedTotal
                    // }
                    console.log("coupon" + couponTotal)
                    res.redirect('/checkout')





                    
                }

            } else {
                res.redirect('/checkout')
            }
        } else {
            res.redirect('/checkout')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const downloadInvoice = async (req,res) => {
    try {
        userSession = req.session
        if(userSession.userId) {
            const id = req.query.id
            const orderData = await Orders.findById({_id:id})
        const userData = await User.findById({_id:userSession.userId})
        await orderData.populate('products.item.productId')
            userSession.currentOrder = id
            const data = {
                order: orderData
            }
            const filePathName = path.resolve(__dirname,'../views/users/invoiceToPdf.ejs')
            const htmlString = fs.readFileSync(filePathName).toString();

            let options = {
                format: 'A3',
                // orientation:"portrait",
                // border:"10mm"

            }


            const ejsData = ejs.render(htmlString,data,userData)


        // const filename = Math.random() + '_doc' + '.pdf';
        // let array = [];
        
        
         pdf.create(ejsData,options).toFile('invoice.pdf',(err,response)=>{
         if(err) {
            console.log(err)
         } })

        const filePath = path.resolve(__dirname,'../invoice.pdf');
        fs.readFile(filePath,(err,file)=>{
            if(err){
                console.log(err);
                return res.status(500).send('could not download file');
            }
            res.setHeader('content-type','application/pdf');
            res.setHeader('content-disposition','attachment;filename="users.pdf"');

            res.send(file);


        })
        //  res.render('orderProductDetail',{order:orderData,user:userData,couponTotal:userSession.couponTotal,offer:userSession.offer})


        // orderData.forEach(orders=> {
        //     const order= {

        //     }

        // })
    }
    } catch (error) {
        console.log(error.message)
    }
}

const returnProduct = async (req, res) => {
    try {
      userSession = req.session
      if (userSession.userId) {
        const userData = await User.findById({ _id: ObjectID(userSession.userId) })
        if (userData.is_verified === 1) {
          const id = req.query.id
          console.log(currentOrder)
          const productOrderData = await Orders.findById({ _id: currentOrder })
          const productData = await Product.findById({ _id: id })
          if (productOrderData) {
            console.log('Product  order data : ' + productOrderData)
            for (let i = 0; i < productOrderData.products.item.length; i++) {
              if (
                new String(productOrderData.products.item[i].productId).trim() ===
                new String(id).trim()
              ) {
                productData.stock += productOrderData.products.item[i].qty
                productOrderData.productReturned[i] = 1
                await productData.save().then(() => {
                  console.log('productData saved')
                })
                await productOrderData.save().then(() => {
                  console.log('productOrderData saved')
                })
              }
            }
            res.redirect('/dashboard')
          } else {
            res.redirect('/dashboard')
          }
        } else {
          res.redirect('/login')
        }
      } else {
        res.redirect('/login')
      }
    } catch (error) {
      console.log(error.message)
    }
  }


module.exports = {
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    currentBanner,
    userLogout,
    userProfile,
    userOrders,
    cancelOrder,
    viewOrderDetail,
    addAddress,
    updateAddress,
    deleteAddress,
    editUser,
    updateUser,
    usershop,
    productDetail,
    loadCart,
    addToCart,
    deleteCart,
    changeProductQnty,
    loadCheckout,
    storeOrder,
    loadSuccess,
    sendMessage,
    loadOtp,
    verifyOtp,
    addToWishlist,
    loadWishlist,
    deleteWishlist,
    addCartDeleteWishlist,
    razorpayCheckout,
    sentOtp,
    checkUser,
    changepassword,
    userForgotPassword,
    addCoupon,
    returnProduct,
    getCategoryProduct,
    downloadInvoice,
    wallet

}