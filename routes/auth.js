const express = require('express');
const passport = require('passport');
const path = require('path');

module.exports = rootPath => {
    const router = express.Router();

    router.get('/signup', (req, res) => {
        res.render('signup', { auth: true, error: { message: req.flash('message')[0] } });
    });

    router.post(
        '/signup',
        passport.authenticate('local-signup', {
            failureRedirect: path.join(rootPath, 'signup'),
            successRedirect: '/'
        })
    );

    router.get('/signin', (req, res) => {
        res.render('signin', { auth: true, error: { message: req.flash('message')[0] } });
    });

    router.post(
        '/signin',
        passport.authenticate('local-signin', {
            failureRedirect: path.join(rootPath, 'signin'),
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
