const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const connectEnsure=require('connect-ensure-login');

router.get('/login',connectEnsure.ensureLoggedOut({redirectTo:'/'}), async(req,res,next)=>{
    res.render('login');
});

router.post('/login',  connectEnsure.ensureLoggedOut({redirectTo:'/'}), passport.authenticate('local',{
    successRedirect: '/',
    successReturnToOrRedirect: '/',
    failureRedirect:'/auth/login',
    failureFlash: true
}));

router.get('/register',async(req,res,next)=>{
    res.render('register');
});

router.post('/register',connectEnsure.ensureLoggedOut({redirectTo:'/'}), [
    body('email').trim().isEmail().withMessage('Email must be a valid email')
        .normalizeEmail().toLowerCase(),
    body('password').trim().isLength(2).withMessage('Password length short'),
    body('password2').custom((value, {req})=>{
        if(value!==req.body.password){
            throw new Error('PassWord do not match')
        }
        return true;
    })
],async(req,res,next)=>{
    try {
        const errors=validationResult(req)
        if(!errors.isEmpty()){
            errors.array().forEach(error=>{
                req.flash('error',error.msg)
            })
            res.render('register',{email: req.body.email, messages:req.flash()});
            return;
        }
        const {email}=req.body;
        const doesExist=await User.findOne({email});
        if(doesExist){
            res.redirect('/auth/register')
                return;
        }
        const user=new User(req.body);
        await user.save();
        req.flash('success',`${user.email} registered successfully you can now login`);
        res.redirect('/auth/login');
    } catch (error) {
        next(error);
    }
});

router.get('/logout',connectEnsure.ensureLoggedIn({redirectTo:'/'}), async(req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err); 
      }
      res.redirect('/');
    });
  });
  

module.exports=router;
