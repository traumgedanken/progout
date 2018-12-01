const Task = require('../models/task');
const cloudinary = require('../config/cloudinary');
const auth = require('../config/auth');
const express = require('express');
const Course = require('../models/course');
const Log = require('../models/log');
const path = require('path');
const Solution = require('../models/solution');

async function forLoadSolution(data, req, task) {
    if (req.user.role !== 'user') return;
    const solution = await Solution.get({ task: task.id, user: req.user.id });
    data.score = solution ? (solution.checked ? solution.score : '?') : '?';
    data.maxScore = task.maxScore || 0;
    if (solution) data.solutionUrl = solution.fileUrl;
}

module.exports = rootPath => {
    const router = express.Router();

    router.get('/', auth.checkAuth(rootPath), async (req, res) => {
        try {
            const data = { tasks_button: true };
            auth.updateData(data, req);
            res.render('tasks', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/new', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const course = await Course.getByName(req.query.course);
            if (!course) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            }
            // additional rights check
            else if (req.user.role !== 'admin' && course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            const data = { tasks_button: true, course: req.query.course };
            auth.updateData(data, req);
            res.render('new_task', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.get('/:id_name', auth.checkAuth(rootPath), async (req, res) => {
        try {
            const task = await Task.getByName(req.params.id_name, true);
            if (!task) return await Log.handleError(rootPath, req, res, { code: 404 });
            const data = { tasks_button: true };
            auth.updateData(data, req);
            await forLoadSolution(data, req, task);
            data.task = task;
            data.course = req.params.id;
            data.user.isAuthor = req.user.role === 'admin' || task.course.author == req.user.id;
            res.render('task', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/delete/:id', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const task = await Task.getByIdAndPopulate(req.params.id);
            if (!task) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            } else if (req.user.role !== 'admin' && task.course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            await Task.delete(req.params.id);
            res.redirect(`/courses/${task.course.name}`);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/new', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const course = await Course.getByName(req.query.course);
            if (!course) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            } else if (req.user.role !== 'admin' && course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            req.files.condition.name = req.body.task_id_name + '.md';
            const url = await cloudinary.uploadFile(
                req.files.condition,
                'conditions/' + req.query.course,
                'raw'
            );
            const newTask = new Task(
                req.body.task_name,
                req.body.task_id_name,
                url,
                req.query.course
            );
            await Task.insert(newTask);
            res.redirect(path.join(rootPath, newTask.id_name));
        } catch (err) {
            req.flash('message', 'Назва та ідентифікатор завдання повинні бути унікальними');
            res.redirect('/error');
        }
    });

    router.get('/update/:id_name', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const task = await Task.getByName(req.params.id_name);
            if (!task) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            } else if (req.user.role !== 'admin' && task.course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            const data = { tasks_button: true, task };
            auth.updateData(data, req);
            res.render('update_task', data);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/update/:id', auth.checkTeacher(rootPath), async (req, res) => {
        try {
            const task = await Task.getByIdAndPopulate(req.params.id);
            if (!task) {
                await Log.handleError(rootPath, req, res, { code: 404 });
                return;
            } else if (req.user.role !== 'admin' && task.course.author != req.user.id) {
                await Log.handleError(rootPath, req, res, { code: 403 });
                return;
            }
            let url;
            if (req.files.condition) {
                req.files.condition.name = req.body.task_id_name + '.md';
                url = await cloudinary.uploadFile(
                    req.files.condition,
                    'conditions/' + task.course.name,
                    'raw'
                );
            }
            const newTask = new Task(req.body.task_name, req.body.task_id_name, url);
            await Task.update(req.params.id, newTask);
            res.redirect(path.join(rootPath, newTask.id_name));
        } catch (err) {
            req.flash('message', 'Назва та ідентифікатор завдання повинні бути унікальними');
            res.redirect('/error');
        }
    });

    router.get('/fs/:id_name', auth.checkAuth(rootPath), async (req, res) => {
        try {
            const task = await Task.getByName(req.params.id_name, true);
            if (!task) await Log.handleError(rootPath, req, res, { code: 404 });
            else res.send(task.condition);
        } catch (err) {
            await Log.handleError(rootPath, req, res, { code: 500, message: err.message });
        }
    });

    router.post('/:id/loadSolution', auth.checkAuth(rootPath), async (req, res) => {
        req.files.solution.name = req.user.username + path.extname(req.files.solution.name);
        const newSolution = {
            course: req.body.course_id,
            task: req.params.id,
            user: req.user.id,
            fileUrl: await cloudinary.uploadFile(
                req.files.solution,
                'solutions/' + req.body.task_id_name,
                'raw'
            )
        };
        const solution = await Solution.get({ task: req.params.id, user: req.user.id });
        if (solution) await Solution.update(solution.id, newSolution);
        else await Solution.insert(newSolution);
        res.redirect(path.join(rootPath, req.body.task_id_name));
    });

    return router;
};
