const mongoose = require('mongoose');
const Task = require('./task');
const User = require('./user');

const MarkSchema = new mongoose.Schema(
    {
        point: { type: Number, default: 0 },
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

const MarkModel = new mongoose.model('Mark', MarkSchema);

class Mark {
    static async getAll(params) {
        if (!params) params = {};
        const query = {};
        if (params.courseId) query.course = params.courseId;
        if (params.userId) query.user = params.userId;
        return await MarkModel.find({ query });
    }

    static async insert(mark) {
        const newMark = await MarkModel(mark).save();
        await Task.addMark(newMark);
        await User.addMark(newMark);
        return newMark;
    }

    static async update(id, newMark) {
        const mark = await MarkModel.findById(id);
        if (newMark.point) mark.point = newMark.point;
        await mark.save();
    }
}

module.exports = Mark;
