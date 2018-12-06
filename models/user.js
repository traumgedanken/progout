const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true
        },
        passwordHash: {
            type: String
        },
        salt: {
            type: String
        },
        googleId: { type: String },
        role: {
            type: String,
            default: 'user'
        },
        fullname: {
            type: String
        },
        avaUrl: {
            type: String,
            default: 'https://lowcars.net/wp-content/uploads/2017/02/userpic.png'
        },
        isDisabled: {
            type: Boolean,
            default: false
        },
        bio: {
            type: String
        },
        courses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            }
        ],
        solutions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Solution'
            }
        ],
        telegram: {
            username: {
                type: String
            },
            chat_id: {
                type: String,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);

UserSchema.plugin(uniqueValidator, {
    message: 'is already taken.'
});

const UserModel = mongoose.model('User', UserSchema);

Array.prototype.remove = function() {
    let what,
        a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

class User {
    static async create(username, password, fullname) {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
        const passwordHash = await User.hashPassword(password + process.env.GLOBAL_SALT + salt);
        return {
            username,
            passwordHash,
            fullname,
            salt
        };
    }

    static async hashPassword(password) {
        return await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
    }
    static async validatePassword(user, password) {
        return await bcrypt.compare(
            password + process.env.GLOBAL_SALT + user.salt,
            user.passwordHash
        );
    }

    static async getAll(params) {
        if (!params) return await UserModel.find();

        // params for api
        const args = {
            page: params.page ? parseInt(params.page) : 1,
            offset: params.offset ? parseInt(params.offset) : 5
        };
        const query = {};
        if (params.role) query.role = params.role;
        if (params.isDisabled) query.isDisabled = params.isDisabled;
        return await UserModel.find(query)
            .skip((args.page - 1) * args.offset)
            .limit(args.offset);
    }

    static async count(params) {
        const query = {};
        if (params.role) query.role = params.role;
        if (params.isDisabled) query.isDisabled = params.isDisabled;
        return await UserModel.countDocuments(query);
    }

    static async getById(id) {
        return await UserModel.findById(id);
    }

    static async getByUsername(username) {
        return await UserModel.findOne({
            username
        }).populate('courses', 'name');
    }

    static async getByOpenId(googleId) {
        return await UserModel.findOne({
            googleId
        }).populate('courses', 'name');
    }

    static async insert(user) {
        return await new UserModel(user).save();
    }

    static async createGoogleUser(profile) {
        const user = {
            fullname: profile.displayName,
            avaUrl: profile._json.image.url + '0',
            googleId: profile.id,
            username: profile.emails[0].value.slice(0, profile.emails[0].value.indexOf('@'))
        };
        return await new UserModel(user).save();
    }

    static async addCourse(userId, courseId) {
        const user = await User.getById(userId);
        user.courses.push(courseId);
        await user.save();
    }

    static async deleteCourse(userId, courseId) {
        const user = await User.getById(userId);
        user.tasks = user.courses.remove(courseId);
        await user.save();
        await mongoose.model('Task').deleteMany({
            course: courseId
        });
    }

    static async update(id, newUser) {
        const user = await UserModel.findById(id);
        if (newUser.role) user.role = newUser.role;
        if (newUser.fullname) user.fullname = newUser.fullname;
        if (newUser.passwordHash) user.passwordHash = newUser.passwordHash;
        if (newUser.bio || newUser.bio === '') user.bio = newUser.bio;
        if (newUser.avaUrl) user.avaUrl = newUser.avaUrl;
        if (newUser.isDisabled) user.isDisabled = newUser.isDisabled;
        if (newUser.telegram && (newUser.telegram.username || newUser.telegram.username === '')) {
            user.telegram.username = newUser.telegram.username;
            user.telegram.chat_id = newUser.telegram.chat_id;
        }
        if (newUser.password)
            user.passwordHash = await User.hashPassword(
                newUser.password + process.env.GLOBAL_SALT + user.salt
            );
        return await user.save();
    }

    static async delete(id) {
        const user = await UserModel.findByIdAndDelete(id);
        if (user)
            for (let courseId of user.courses) {
                await mongoose.model('Course').findByIdAndDelete(courseId);
                await mongoose.model('Task').deleteMany({
                    course: courseId
                });
            }
        return user;
    }

    static async addSolution(solution) {
        const user = await UserModel.findById(solution.user);
        user.solutions.push(solution.id);
        await user.save();
    }
}

module.exports = User;
