const Course = require("./course");
const download = require("download");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const TaskSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        id_name: {
            type: String,
            lowercase: true,
            required: true,
            unique: true
        },
        condition_url: { type: String, required: true },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            default: "5bdaf25f678fc1158a481822"
        }
    },
    { timestamps: true }
);

TaskSchema.plugin(uniqueValidator, { message: "is already taken" });

const TaskModel = mongoose.model("Task", TaskSchema);

class Task {
    constructor(name, id_name, condition_url, course) {
        this.name = name;
        this.id_name = id_name;
        this.condition_url = condition_url;
        this.course = course;
    }

    static async getAll(params) {
        if (!params) return await TaskModel.find().populate("course", "name");

        // params for api
        const args = {
            page: params.page ? parseInt(params.page) : 1,
            offset: params.offset ? parseInt(params.offset) : 5
        };
        const query = {};
        if (params.course) query.course = params.course;
        if (params.search) query.name = { $regex: params.search, $options: "i" };
        return await TaskModel.find(query)
            .skip((args.page - 1) * args.offset)
            .limit(args.offset)
            .populate("course", "name");
    }

    static async count(params) {
        const query = {};
        if (params.course) query.course = params.course;
        if (params.search) query.name = { $regex: params.search, $options: "i" };
        return await TaskModel.countDocuments(query);
    }

    static async getById(id) {
        return await TaskModel.findById(id);
    }

    static async getByIdAndPopulate(id) {
        return await TaskModel.findById(id).populate("course");
    }

    static async getByName(id_name, withCondition) {
        const task = await TaskModel.findOne({ id_name })
            .populate("author", "fullname")
            .populate("course");
        if (!task || !withCondition) return task;
        const data = await download(task.condition_url);
        task.condition = data.toString();
        return task;
    }

    static async insert(task) {
        const course = (await Course.getByName(task.course)) || (await Course.getById(task.course));
        task.course = course.id;
        task = await TaskModel(task).save();
        task.course = course.id;
        await Course.addTask(task.course, task.id);
        return task;
    }

    static async delete(id) {
        const task = await TaskModel.findByIdAndDelete(id).populate("course", "name");
        if (task) await Course.deleteTask(task.course.id, task.id);
        return task;
    }

    static async update(id, newTask) {
        const task = await TaskModel.findById(id);
        if (!task) return null;
        if (newTask.name) task.name = newTask.name;
        if (newTask.id_name) task.id_name = newTask.id_name;
        if (newTask.condition_url) task.condition_url = newTask.condition_url;
        return await task.save();
    }
}

module.exports = Task;
