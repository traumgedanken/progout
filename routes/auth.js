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

    return router;
};
