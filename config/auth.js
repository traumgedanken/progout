const Log = require('../models/log');
const passport = require('passport');

module.exports = {
    checkAuth: path => {
        return async (req, res, next) => {
            if (!req.user)
                await Log.handleError(path, req, res, {
                    code: 401
                });
            else next();
        };
    },
    checkAuthBasic: path => {
        return async (req, res, next) => {
            if (req.user) return next();
            passport.authenticate('basic', async (err, user) => {
                if (!user || err)
                    await Log.handleError(path, req, res, {
                        code: 401,
                        message: 'not authorized'
                    });
                else
                    req.logIn(
                        user,
                        {
                            session: false
                        },
                        () => next()
                    );
            })(req, res, next);
        };
    },
    checkAdmin: path => {
        return async (req, res, next) => {
            if (!req.user)
                await Log.handleError(path, req, res, {
                    code: 401,
                    message: 'not authorized'
                });
            else if (req.user.role !== 'admin')
                await Log.handleError(path, req, res, {
                    code: 403,
                    message: 'forbidden'
                });
            else next();
        };
    },
    checkTeacher: path => {
        return async (req, res, next) => {
            if (!req.user)
                await Log.handleError(path, req, res, {
                    code: 401,
                    message: 'not authorized'
                });
            else if (req.user.role !== 'admin' && req.user.role !== 'teacher')
                await Log.handleError(path, req, res, {
                    code: 403,
                    message: 'forbidden'
                });
            else next();
        };
    },
    updateData: (data, req) => {
        data.user = req.user;
        data.user[req.user.role] = true;
    }
};
