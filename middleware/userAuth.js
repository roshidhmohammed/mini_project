const session = require("express-session");


let userSession = false || {}
let isLoggedIn

const isLogin = async (req,res,next) => {
    try {
        userSession = req.session
        if(req.session.userId) {
        next();
        }
        else{
            res.redirect('/login');
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req,res,next) => {
    try {
        userSession = req.session
        if(req.session.userId){
            req.session.userId=null
            res.redirect('/login');
        }else{
            res.redirect('/login');
        }
        next()
       
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}