const Course = require('../models/course');
const auth = require('../config/auth');
const express = require('express');
const Log = require('../models/log');
const path = require('path');
const Solution = require('../models/solution');
const Telegram = require('../modules/telegram');
const User = require('../models/user');

module.exports = rootPath => {
    const router = express.Router();

    router.get('/', auth.checkAuth(rootPath), async (req, res) => {
        try {
            const data = { courses_button: true };
            auth.updateData(data, req);
            if (req.user.role === 'admin') data.user.teacher = true;
            res.render('courses', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/:name/check', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const course = await Course.getByName(req.params.name);
            if (req.user.role !== 'admin' && req.user.id != course.author)
                return await Log.handleError(rootPath, req, res, { code: 403 });
            const solutions = await Solution.getAll({ course: course.id, checked: false }, true);
            const data = { courses_button: true, list: solutions };
            auth.updateData(data, req);
            res.render('solutions', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/new', auth.checkTeacher(rootPath), (req, res) => {
        const data = { courses_button: true };
        auth.updateData(data, req);
        res.render('new_course', data);
    });

    router.post('/new', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            await Course.insert({ name: req.body.course_name, author: req.user.id });
            res.redirect(path.join(rootPath, req.body.course_name));
        } catch (err) {
            req.flash('message', 'Курс з такою назвою уже існує');
            res.redirect('/error');
        }
    });

    router.get('/:name', auth.checkAuth(rootPath), async (req, res) => {
        try {
            const course = await Course.getByName(req.params.name);
            if (!course) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            }
            let data = { courses_button: true, course: { name: course.name, id: course.id } };
            auth.updateData(data, req);
            data.user.isAuthor = req.user.role === 'admin' || course.author == req.user.id;
            res.render('course', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/delete/:id', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const course = await Course.getById(req.params.id);
            if (!course) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            }
            // additional rights check
            else if (req.user.role !== 'admin' && course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            await Course.delete(req.params.id);
            res.redirect(rootPath);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/update/:name', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const course = await Course.getByName(req.params.name);
            if (!course) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            } else if (req.user.role !== 'admin' && course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            const data = { courses_button: true, course };
            auth.updateData(data, req);
            res.render('update_course', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/update/:id', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const course = await Course.getById(req.params.id);
            if (!course) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            } else if (req.user.role !== 'admin' && course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            await Course.update(req.params.id, req.body.course_name);
            res.redirect(path.join(rootPath, req.body.course_name));
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/check/:solution_id', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            await Solution.update(req.params.solution_id, {
                score: req.body.score,
                checked: true
            });
            const solution = await Solution.getById(req.params.solution_id, true);
            const user = await User.getById(solution.user.id);
            await Telegram.sendMessage(
                user,
                `Your task \`/${solution.course.name}/${
                    solution.task.id_name
                }\` was checked.\nResult: ${solution.score} / ${solution.task.maxScore}`
            );
            res.redirect(`/courses/${solution.course.name}/check`);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    return router;
};
