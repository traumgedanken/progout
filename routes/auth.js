const express = require('express');
const passport = require('passport');
const path = require('path');

module.exports = rootPath => {
    const router = express.Router();

    router.get('/register', (req, res) => {
        res.render('register', { auth: true, error: { message: req.flash('message')[0] } });
    });

    router.post(
        '/register',
        passport.authenticate('local-signup', {
            failureRedirect: path.join(rootPath, 'register'),
            successRedirect: '/'
        })
    );

    router.get('/login', (req, res) => {
        res.render('login', { auth: true, error: { message: req.flash('message')[0] } });
    });

    router.post(
        '/login',
        passport.authenticate('local-login', {
            failureRedirect: path.join(rootPath, 'login'),
            successRedirect: '/'
        })
    );

    router.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    router.get('/login/google', passport.authenticate('google', { scope: ['email'] }), () => {
        // The request will be redirected to Google for authentication, so
        // this function will not be called.
    });

    router.get(
        '/google/cb',
        passport.authenticate('google', { failureRedirect: '/auth/login/' }),
        (req, res) => {
            // Successful authentication, redirect home.
            res.redirect('/');
        }
    );

    return router;
};
