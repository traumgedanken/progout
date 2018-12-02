const mongoose = require('mongoose');
const Course = require('./course');
const User = require('./user');

const SolutionSchema = new mongoose.Schema(
    {
        fileUrl: { type: String, required: true },
        score: { type: Number, default: 0 },
        checked: { type: Boolean, default: false },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

const SolutionModel = new mongoose.model('Solution', SolutionSchema);

class Solution {
    static async getAll(params, detailed) {
        if (!params) params = {};
        const query = {};
        if (params.course) query.course = params.course;
        if (params.task) query.task = params.task;
        if (params.user) query.user = params.user;
        if (params.checked != null) query.checked = params.checked;
        if (detailed)
            return await SolutionModel.find(query)
                .populate('course')
                .populate('user')
                .populate('task');
        return await SolutionModel.find(query);
    }

    static async getById(id, detailed) {
        if (!detailed) return await SolutionModel.findById(id);
        return await SolutionModel.findById(id)
            .populate('course')
            .populate('user')
            .populate('task');
    }

    static async get(params, detailed) {
        if (!params) params = {};
        const query = {};
        if (params.course) query.course = params.course;
        if (params.task) query.task = params.task;
        if (params.user) query.user = params.user;
        if (params.checked != null) query.checked = params.checked;
        if (detailed)
            return await SolutionModel.findOne(query)
                .populate('course')
                .populate('user')
                .populate('task');
        return await SolutionModel.findOne(query);
    }

    static async insert(solution) {
        const newSolution = await SolutionModel(solution).save();
        await Course.addSolution(newSolution);
        await User.addSolution(newSolution);
        return newSolution;
    }

    static async update(id, newSolution) {
        const solution = await SolutionModel.findById(id);
        if (newSolution.score) solution.score = newSolution.score;
        if (newSolution.fileUrl) solution.fileUrl = newSolution.fileUrl;
        if (newSolution.checked != null) solution.checked = newSolution.checked;
        await solution.save();
    }
}

module.exports = Solution;
