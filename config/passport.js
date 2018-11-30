const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const passport = require('passport');
const User = require('../models/user');

passport.serializeUser(function(user, done) {
    done(null, user.username);
});

passport.deserializeUser(async function(username, done) {
    try {
        const user = await User.getByUsername(username);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(
    'local-signup',
    new LocalStrategy(
        {
            passReqToCallback: true
        },
        async function(req, username, password, done) {
            const password2 = req.body.passwordRepeat;
            const fullname = req.body.fullname;
            if (password !== password2) {
                done(null, false, req.flash('message', 'Паролі не співпадають'));
                return;
            }
            try {
                const user = await User.create(username, password, fullname);
                const insertedUser = await User.insert(user);
                done(null, insertedUser);
            } catch (err) {
                console.log(err.toString());
                done(null, false, req.flash('message', 'Користувач з таким логіном уже існує'));
            }
        }
    )
);

passport.use(
    'local-login',
    new LocalStrategy(
        {
            passReqToCallback: true
        },
        async function(req, username, password, done) {
            const user = await User.getByUsername(username);
            if (!user) {
                done(null, false, req.flash('message', 'Користувача з таким логіном не знайдено'));
                return;
            }
            const validPassword = await User.validatePassword(user, password);
            if (validPassword) done(null, user);
            else done(null, false, req.flash('message', 'Невірний пароль'));
        }
    )
);

passport.use(
    'basic',
    new BasicStrategy(async function(username, password, done) {
        const user = await User.getByUsername(username);
        if (!user) {
            done(null, false);
            return;
        }
        const validPassword = await User.validatePassword(user, password);
        if (validPassword) done(null, user);
        else done(null, false);
    })
);
