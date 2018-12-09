const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
            if (
                !password ||
                !password2 ||
                !fullname ||
                password.length < 8 ||
                password.length > 20 ||
                password !== password2 ||
                !/^[іІєЄa-zA-Zа-яА-Я]+(([',. -][іІєЄa-zA-Zа-яА-Я ])?[іІєЄa-zA-Zа-яА-Я]*)*$/.test(
                    fullname
                )
            ) {
                done(null, false, req.flash('message', 'Ivalid input'));
                return;
            }
            try {
                const user = await User.create(username, password, fullname);
                const insertedUser = await User.insert(user);
                done(null, insertedUser);
            } catch (err) {
                console.log(err.toString());
                done(null, false, req.flash('message', 'Username is already taken'));
            }
        }
    )
);

passport.use(
    'local-signin',
    new LocalStrategy(
        {
            passReqToCallback: true
        },
        async function(req, username, password, done) {
            const user = await User.getByUsername(username);
            if (!user)
                return done(
                    null,
                    false,
                    req.flash('message', 'There is no user with such username')
                );
            const validPassword = await User.validatePassword(user, password);
            if (validPassword) done(null, user);
            else done(null, false, req.flash('message', 'Invalid password'));
        }
    )
);

passport.use(
    'basic',
    new BasicStrategy(async function(username, password, done) {
        const user = await User.getByUsername(username);
        if (!user) return done(null, false);
        const validPassword = await User.validatePassword(user, password);
        if (validPassword) done(null, user);
        else done(null, false);
    })
);

passport.use(
    'google',
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_API_CLIENT_ID,
            clientSecret: process.env.GOOGLE_API_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_API_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
            const user =
                (await User.getByOpenId(profile.id)) || (await User.createGoogleUser(profile));
            return done(null, user);
        }
    )
);
