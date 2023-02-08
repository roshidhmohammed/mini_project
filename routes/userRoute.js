const express = require("express");
const user_route = express();

const User = require("../models/userModel");
const Product = require("../models/productModel");
const Orders =require("../models/ordersModel");
const Offer = require("../models/offerModel")
const Address=  require('../models/addressModel')

const auth = require("../middleware/userAuth");

user_route.set('views', './views/users');

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

let isLoggedin
isLoggedin = false
let userSession = false || {}

const multer = require('../util/multer');
const path = require("path");

// const storage = multer.diskStorage({
//     destination:function(req,file,cb){
//         cb(null,path.join(__dirname, '../public/userImages'));

//     },
//     filename:function(req,file,cb) {
//         const name = Date.now()+'-'+file.originalname;
//         cb(null,name);
//     }
// });

// const upload = multer({storage:storage});

const userController = require("../controllers/userController");
// const { config } = require("process");

user_route.get('/register', userController.loadRegister );

user_route.post('/register',userController.insertUser);

user_route.get('/verifyOtp', userController.loadOtp)
user_route.post('/verifyOtp', userController.verifyOtp)

user_route.get('/', userController.loginLoad );
user_route.get('/login', userController.loginLoad );

user_route.post('/login', userController.verifyLogin );

user_route.get('/dashboard',userController.userProfile);
user_route.get('/address',auth.isLogin,userController.addAddress);
user_route.post('/address',auth.isLogin,userController.updateAddress);
user_route.get('/delete-address', userController.deleteAddress);


user_route.get('/orders',auth.isLogin, userController.userOrders);
user_route.get('/cancel-order',auth.isLogin, userController.cancelOrder);
user_route.get('/orderProductDetail',auth.isLogin,userController.viewOrderDetail);

user_route.get('/wallet',auth.isLogin,userController.wallet);

user_route.get('/edit-user',auth.isLogin,userController.editUser);
user_route.post('/edit-user',userController.updateUser)

user_route.get('/view-product', userController.loadHome);

user_route.get('/logout',auth.isLogin, userController.userLogout);
user_route.post("/changeProductQnty",userController.changeProductQnty)


user_route.get('/forgotpassword', userController.userForgotPassword)
user_route.post('/forgotpassword', userController.checkUser)
user_route.post('/forgotpasswordotp', userController.sentOtp)
user_route.post('/forgotpasswordchange', userController.changepassword)


// user_route.get('/view-product', userController.loadshop);
user_route.get('/shop', userController.usershop);
user_route.get('/productDetail',userController.productDetail)


user_route.get('/categoryProduct',userController.getCategoryProduct)

user_route.get('/cart', userController.loadCart);
user_route.get('/addToCart', userController.addToCart);
user_route.get('/delete-cart', userController.deleteCart);

user_route.post('/add-coupon',userController.addCoupon);

user_route.get('/add-to-wishlist',userController.addToWishlist);
user_route.get('/wishlist', userController.loadWishlist);
user_route.get('/delete-wishlist', userController.deleteWishlist);
user_route.get('/add-to-cart-delete-wishlist', userController.addCartDeleteWishlist);

user_route.post('/razorpay',userController.razorpayCheckout)

user_route.get('/checkout', userController.loadCheckout);
user_route.post('/checkout',auth.isLogin,userController.storeOrder);
user_route.get('/orderSuccess',auth.isLogin,userController.loadSuccess);


user_route.get('/cancelProduct', userController.returnProduct)

user_route.get('/export-invoice-pdf',auth.isLogin,userController.downloadInvoice)

// user_route.get('/return-product',userController.returnProduct)

module.exports = user_route;