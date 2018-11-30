const mongoose = require('mongoose');
const path = require('path');
const telegramBot = require('../modules/telegram');

const LogSchema = new mongoose.Schema(
    {
        ip: {
            type: String,
            default: 'NO IP'
        },
        user: {
            type: String,
            default: 'NO USER'
        },
        requestMethod: {
            type: String,
            default: 'NO METHOD'
        },
        url: {
            type: String,
            default: 'NO URL'
        },
        statusSent: {
            type: Number,
            default: 520
        },
        messageSent: {
            type: String,
            default: 'NO MESSAGE'
        }
    },
    {
        timestamps: true
    }
);

const LogModel = mongoose.model('Log', LogSchema);

function statusToMessage(status) {
    switch (status) {
        case 400:
            return 'Погано сформований запит';
        case 401:
            return 'Для перегляду цієї сторніки необхідно авторизуватися';
        case 403:
            return 'У вас недостатньо прав для перегляду цієї сторніки';
        case 404:
            return 'На жаль шуканої сторінки не існує';
        case 500:
            return 'Сталася неочікувана помилка. Не хвилюйтеся - це наша вина';
        case 520:
            return 'Невідома помилка';
        default:
            return 'Невідома помилка';
    }
}

class Log {
    constructor(ip, user, method, url, status, message) {
        if (ip) this.ip = ip;
        if (user) this.user = user;
        if (method) this.requestMethod = method;
        if (url) this.url = url;
        if (status) this.statusSent = status;
        if (message) this.messageSent = message;
    }

    static async getAll(params) {
        // params for api
        const args = {
            page: params.page ? parseInt(params.page) : 1,
            offset: params.offset ? parseInt(params.offset) : 5
        };
        return await LogModel.find(
            {},
            ['user', 'ip', 'requestMethod', 'url', 'statusSent', 'messageSent', 'createdAt'],
            {
                sort: {
                    createdAt: -1
                }
            }
        )
            .skip((args.page - 1) * args.offset)
            .limit(args.offset);
    }

    static async count() {
        return await LogModel.countDocuments();
    }

    static async insert(log) {
        return await LogModel(log).save();
    }

    static toString(log) {
        return (
            `User: \`${log.user}\`\n` +
            `IP-adress: \`${log.ip}\`\n` +
            `Request method: \`${log.requestMethod}\`\n` +
            `URL: \`${log.url}\`\n` +
            `Status: \`${log.statusSent}\`\n` +
            `Message: \`${log.messageSent}\``
        );
    }

    static async createAndInsert(rootPath, req, res, error) {
        const status = error.code || 520;
        return await Log.insert(
            new Log(
                req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                req.user ? req.user.username : null,
                req.method,
                path.join(rootPath, req.url),
                status,
                error.message
            )
        );
    }

    static async handleError(rootPath, req, res, error) {
        const log = await Log.createAndInsert(rootPath, req, res, error);
        const message = Log.toString(log);
        await telegramBot.notifyAdmin(message);

        if (!res) return;
        if (rootPath === '/api/v1')
            res.status(log.statusSent).json({
                message: error.message
            });
        else if (req.method === 'POST') res.sendStatus(log.statusSent);
        else {
            const data = {
                error: {
                    code: log.statusSent,
                    message: statusToMessage(log.statusSent)
                }
            };
            // because auth.updateData is not a function here (?)
            if (req.user) {
                data.user = req.user;
                data.user[req.user.role] = true;
            }
            res.status(log.statusSent).render('error', data);
        }
    }
}

module.exports = Log;
