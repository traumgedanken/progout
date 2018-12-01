const mongoose = require('mongoose');
const Task = require('./task');
const User = require('./user');

const SolutionSchema = new mongoose.Schema(
    {
        fileUrl: { type: String, required: true },
        checked: { type: Boolean, default: false },
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

const SolutionModel = new mongoose.model('Solution', SolutionSchema);

class Solution {
    static async getAll(params) {
        if (!params) params = {};
        const query = {};
        if (params.taskId) query.task = params.taskId;
        if (params.userId) query.user = params.userId;
        if (params.checked) query.checked = params.checked;
        return await SolutionModel.find(query);
    }

    static async insert(solution) {
        const newSolution = await SolutionModel(solution).save();
        await Task.addSolution(newSolution);
        await User.addSolution(newSolution);
        return newSolution;
    }

    static async update(id, newSolution) {
        const solution = await SolutionModel.findById(id);
        if (newSolution.fileUrl) solution.fileUrl = newSolution.fileUrl;
        if (newSolution.checked) solution.checked = newSolution.checked;
        await solution.save();
    }
}

module.exports = Solution;