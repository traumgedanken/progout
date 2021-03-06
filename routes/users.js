const User = require('../models/user');
const auth = require('../config/auth');
const express = require('express');
const Log = require('../models/log');
const path = require('path');
const telegram = require('../modules/telegram');
const cloudinary = require('../config/cloudinary');

module.exports = rootPath => {
    const router = express.Router();

    router.get('/', auth.checkAdmin(rootPath), async (req, res) => {
        try {
            const data = { users_button: true };
            auth.updateData(data, req);
            res.render('users', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/:username', auth.checkAuth(rootPath), async (req, res) => {
        try {
            const user = await User.getByUsername(req.params.username);
            if (!user) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            }
            const data = { users_button: true };
            auth.updateData(data, req);
            data.userToDisplay = user;
            data.userToDisplay[user.role] = true;
            res.render('user', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/changerole/:id', auth.checkAdmin(rootPath), async (req, res) => {
        const role = req.body.role;
        if (role !== 'admin' && role !== 'teacher' && role != 'user') {
            req.flash('message', 'Invalid role');
            return res.redirect('/error');
        }
        try {
            const user = await User.update(req.params.id, { role: role });
            res.redirect(path.join(rootPath, user.username));
            await telegram.sendMessage(
                user,
                `Your role was changed to \`${user.role || 'guest'}\``
            );
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    async function checkUserData(req, res, next) {
        const fullname = req.body.fullname;
        const tgUsername = req.body.telegramUsername;
        if (
            !fullname ||
            fullname.length < 4 ||
            fullname.length > 20 ||
            (tgUsername && !/[a-zA-Z0-9_]+/.test(tgUsername)) ||
            !/^[іІєЄa-zA-Zа-яА-Я]+(([',. -][іІєЄa-zA-Zа-яА-Я ])?[іІєЄa-zA-Zа-яА-Я]*)*$/.test(
                fullname
            )
        ) {
            req.flash('message', 'Invalid input');
            return res.redirect('/error');
        }
        const user = await User.getTgUser(tgUsername);
        if (user && tgUsername && req.user.id != user.id) {
            req.flash('message', 'Telegram username is already taken');
            return res.redirect('/error');
        }
        next();
    }

    router.post('/update/:id', auth.checkAuth(rootPath), checkUserData, async (req, res) => {
        try {
            let avaUrl = null;
            if (req.files.ava) {
                req.files.ava.name = req.user.username + path.extname(req.files.ava.name);
                avaUrl = await cloudinary.uploadFile(req.files.ava, 'users/', 'image');
            }
            await User.update(req.params.id, {
                fullname: req.body.fullname,
                telegram: { username: req.body.telegramUsername || '', chat_id: null },
                bio: req.body.bio || '',
                avaUrl
            });
            res.redirect('/profile');
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    return router;
};
