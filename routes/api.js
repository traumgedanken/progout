const express = require('express');
const User = require('../models/user');
const Course = require('../models/course');
const Task = require('../models/task');
const auth = require('../config/auth');
const Log = require('../models/log');

module.exports = rootPath => {
    const router = express.Router();

    router.get('/me', auth.checkAuthBasic(rootPath), (req, res) => res.json(req.user));

    // USERS
    router.get(
        '/users',
        auth.checkAuthBasic(rootPath),
        auth.checkAdmin(rootPath),
        async (req, res) => {
            try {
                const params = {
                    page: req.query.page,
                    offset: req.query.offset,
                    role: req.query.role,
                    isDisabled: req.query.isDisabled
                };
                const users = await User.getAll(params);
                const count = await User.count(params);
                res.json({ users, count });
            } catch (err) {
                await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
            }
        }
    );

    router.get('/users/exist/:username', async (req, res) => {
        try {
            const user = await User.getByUsername(req.params.username);
            res.json({ exist: !!user });
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get(
        '/users/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkAdmin(rootPath),
        async (req, res) => {
            try {
                const user = await User.getById(req.params.id);
                if (user) res.json(user);
                else throw { code: 404, message: 'not found' };
            } catch (err) {
                await Log.handleError(rootPath, req, res, {
                    code: err.code || 500,
                    message: err.message
                });
            }
        }
    );

    router.delete(
        '/users/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkAdmin(rootPath),
        async (req, res) => {
            try {
                const user = await User.delete(req.params.id);
                if (user) res.json(user);
                else throw { code: 404, message: 'not found' };
            } catch (err) {
                await Log.handleError(rootPath, req, res, {
                    code: err.code || 500,
                    message: err.message
                });
            }
        }
    );

    router.put(
        '/users/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkAdmin(rootPath),
        async (req, res) => {
            try {
                const user = {
                    role: req.body.role,
                    avaUrl: req.body.avaUrl,
                    isDisabled: req.body.isDisabled,
                    fullname: req.body.fullname,
                    password: req.body.password
                };
                const updatedUser = await User.update(req.params.id, user);
                if (updatedUser) res.json(updatedUser);
                else throw { code: 404, message: 'not found' };
            } catch (err) {
                await Log.handleError(rootPath, req, res, {
                    code: err.code || 500,
                    message: err.message
                });
            }
        }
    );

    async function chechQueryPostUser(req, res, next) {
        const username = req.body.username;
        const password = req.body.password;
        const fullname = req.body.fullname;
        if (username && password && fullname) next();
        else
            await Log.handleError(rootPath, req, res, {
                code: 400,
                message:
                    'no ' +
                    (username ? '' : 'username + ') +
                    (password ? '' : 'password + ') +
                    (fullname ? '' : 'fullname ') +
                    'was provided'
            });
    }

    router.post(
        '/users',
        auth.checkAuthBasic(rootPath),
        auth.checkAdmin(rootPath),
        chechQueryPostUser,
        async (req, res) => {
            try {
                const newUser = await User.create(
                    req.body.username,
                    req.body.password,
                    req.body.fullname
                );
                if (req.body.role) newUser.role = req.body.role;
                const createdUser = await User.insert(newUser);
                res.json(createdUser);
            } catch (err) {
                await Log.handleError(rootPath, req, res, { code: 400, message: err.message });
            }
        }
    );

    // COURSES
    router.get('/courses', auth.checkAuthBasic(rootPath), async (req, res) => {
        try {
            const params = {
                page: req.query.page,
                offset: req.query.offset,
                author: req.query.author
            };
            const courses = await Course.getAll(params);
            const count = await Course.count(params);
            res.json({ courses, count });
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/courses/:id', auth.checkAuthBasic(rootPath), async (req, res) => {
        try {
            const course = await Course.getById(req.params.id);
            if (course) res.json(course);
            else throw { code: 404, message: 'not found' };
        } catch (err) {
            await Log.handleError(rootPath, req, res, {
                code: err.code || 500,
                message: err.message
            });
        }
    });

    router.delete(
        '/courses/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkTeacher(rootPath),
        async (req, res) => {
            try {
                const course = await Course.getById(req.params.id);
                if (!course) throw { code: 404, message: 'not found' };
                if (req.user.role !== 'admin' && course.author != req.user.id)
                    throw { code: 403, message: 'forbidden' };
                res.json(await Course.delete(req.params.id));
            } catch (err) {
                await Log.handleError(rootPath, req, res, {
                    code: err.code || 500,
                    message: err.message
                });
            }
        }
    );

    router.put(
        '/courses/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkTeacher(rootPath),
        async (req, res) => {
            try {
                const course = await Course.getById(req.params.id);
                if (!course) throw { code: 404, message: 'not found' };
                if (req.user.role !== 'admin' && course.author != req.user.id)
                    throw { code: 403, message: 'forbidden' };
                res.json(await Course.update(req.params.id, req.body.name));
            } catch (err) {
                await Log.handleError(rootPath, req, res, {
                    code: err.code || 500,
                    message: err.message
                });
            }
        }
    );

    async function chechQueryPostCourse(req, res, next) {
        const name = req.body.name;
        if (name) next();
        else
            await Log.handleError(rootPath, req, res, {
                code: 400,
                message: 'no name was provided'
            });
    }

    router.post(
        '/courses',
        auth.checkAuthBasic(rootPath),
        auth.checkTeacher(rootPath),
        chechQueryPostCourse,
        async (req, res) => {
            try {
                const newCourse = await Course.insert({
                    name: req.body.name,
                    author: req.user.id
                });
                res.json({ newCourse });
            } catch (err) {
                await Log.handleError(rootPath, req, res, { code: 400, message: err.message });
            }
        }
    );

    // TASKS
    router.get('/tasks', auth.checkAuthBasic(rootPath), async (req, res) => {
        try {
            const params = {
                page: req.query.page,
                offset: req.query.offset,
                course: req.query.course,
                search: req.query.search
            };
            const tasks = await Task.getAll(params);
            const count = await Task.count(params);
            await res.json({ tasks, count });
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/tasks/:id', auth.checkAuthBasic(rootPath), async (req, res) => {
        try {
            const task = await Task.getById(req.params.id);
            if (task) res.json(task);
            else throw { code: 404, message: 'not found' };
        } catch (err) {
            await Log.handleError(rootPath, req, res, {
                code: err.code || 500,
                message: err.message
            });
        }
    });

    router.delete(
        '/tasks/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkTeacher(rootPath),
        async (req, res) => {
            try {
                const task = await Task.getByIdAndPopulate(req.params.id);
                if (!task) throw { code: 404, message: 'not found' };
                if (req.user.role !== 'admin' && task.course.author != req.user.id)
                    throw { code: 403, message: 'forbidden' };
                res.json(await Task.delete(req.params.id));
            } catch (err) {
                await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
            }
        }
    );

    router.put(
        '/tasks/:id',
        auth.checkAuthBasic(rootPath),
        auth.checkTeacher(rootPath),
        async (req, res) => {
            try {
                const task = await Task.getByIdAndPopulate(req.params.id);
                if (!task) throw { code: 404, message: 'not found' };
                if (req.user.role !== 'admin' && task.course.author != req.user.id) {
                    throw { code: 403, message: 'forbidden' };
                }
                res.json(
                    await Task.update(req.params.id, {
                        name: req.body.name,
                        id_name: req.body.id_name,
                        condition_url: req.body.condition_url
                    })
                );
            } catch (err) {
                await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
            }
        }
    );

    async function chechQueryPostTask(req, res, next) {
        const name = req.body.name;
        const id_name = req.body.name;
        const condition_url = req.body.condition_url;
        const courseId = req.body.course;
        if (name && id_name && condition_url && courseId) next();
        else
            await Log.handleError(rootPath, req, res, {
                code: 500,
                message:
                    'no ' +
                    (name ? '' : 'name + ') +
                    (id_name ? '' : 'id_name + ') +
                    (condition_url ? '' : 'condition_url + ') +
                    (courseId ? '' : 'course ') +
                    'was provided'
            });
    }

    router.post(
        '/tasks',
        auth.checkAuthBasic(rootPath),
        auth.checkTeacher(rootPath),
        chechQueryPostTask,
        async (req, res) => {
            try {
                const course =
                    (await Course.getByName(req.body.course)) ||
                    (await Course.getById(req.body.course));
                if (!course) throw { code: 404, message: 'course not found' };
                if (req.user.role !== 'admin' && course.author != req.user.id)
                    throw { code: 403, message: 'forbidden' };
                res.json(
                    await Task.insert({
                        name: req.body.name,
                        id_name: req.body.id_name,
                        condition_url: req.body.condition_url,
                        course: req.body.course
                    })
                );
            } catch (err) {
                await Log.handleError(rootPath, req, res, {
                    code: err.code || 500,
                    message: err.message
                });
            }
        }
    );

    // LOGS
    router.get(
        '/logs',
        auth.checkAuthBasic(rootPath),
        auth.checkAdmin(rootPath),
        async (req, res) => {
            try {
                const params = {
                    page: req.query.page,
                    offset: req.query.offset
                };
                const logs = await Log.getAll(params);
                const count = await Log.count(params);
                res.json({ logs, count });
            } catch (err) {
                await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
            }
        }
    );

    router.all('*', async (req, res) => {
        await Log.handleError(rootPath, req, res, { code: 400, message: 'bad request' });
    });

    return router;
};
