const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.DBURL);

const express = require("express");
const app = express();



const session = require("express-session");
const config = require("./config/config");
app.use(session({secret:config.sessionSecret, resave:true, saveUninitialized:true}))

// app.use(session({secret:"mini-project", resave:true, saveUninitialized:true}))

app.use(express.static('public'));
app.use(express.static('public/user'));
//for user routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

app.set('view engine', 'ejs');



const adminRoute = require("./routes/adminRoute");
const { defaultConfiguration } = require('./routes/adminRoute');
app.use('/admin', adminRoute);

app.get('*', function (req,res){
    res.status(404).render('users/404')
})




app.listen(3000, function() {
    console.log("server is running");
});


