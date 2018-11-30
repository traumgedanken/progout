const User = require('./user');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const CourseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        tasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task'
            }
        ]
    },
    {
        timestamps: true
    }
);

CourseSchema.plugin(uniqueValidator, {
    message: 'is already taken.'
});

const CourseModel = mongoose.model('Course', CourseSchema);

class Course {
    static async getAll(params) {
        if (!params) return await CourseModel.find().populate('author', 'fullname');

        // params for api
        const args = {
            page: params.page ? parseInt(params.page) : 1,
            offset: params.offset ? parseInt(params.offset) : 5
        };
        const query = {};
        if (params.author) query.author = params.author;
        return await CourseModel.find(query)
            .skip((args.page - 1) * args.offset)
            .limit(args.offset)
            .populate('author', 'fullname');
    }

    static async count(params) {
        const query = {};
        if (params.author) query.author = params.author;
        return await CourseModel.countDocuments(query);
    }

    static async getByName(name) {
        return await CourseModel.findOne({
            name
        }).populate('tasks');
    }

    static async getById(id) {
        return await CourseModel.findById(id);
    }

    static async delete(id) {
        const course = await CourseModel.findByIdAndDelete(id);
        if (course) await User.deleteCourse(course.author, id);
        return course;
    }

    static async insert(course) {
        const newCourse = await CourseModel(course).save();
        await User.addCourse(course.author, newCourse.id);
        return newCourse;
    }

    static async addTask(courseId, taskId) {
        const course = await Course.getById(courseId);
        course.tasks.push(taskId);
        await course.save();
    }

    static async deleteTask(userId, taskId) {
        const course = await Course.getById(userId);
        course.tasks = course.tasks.remove(taskId);
        await course.save();
    }

    static async update(id, newName) {
        const course = await CourseModel.findById(id);
        if (!course) return null;
        course.name = newName;
        await course.save();
    }
}

module.exports = Course;
