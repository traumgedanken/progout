const telegram = require('telegram-bot-api');
const User = require('../models/user');
const Solution = require('../models/solution');
const Course = require('../models/course');
const Task = require('../models/task');

const adminBot =
    process.env.LOCAL && !process.env.BOT_DEV
        ? null
        : new telegram({
              token: process.env.ADMIN_BOT_TOKEN
          });

const userBot =
    process.env.LOCAL && !process.env.BOT_DEV
        ? null
        : new telegram({
              token: process.env.USER_BOT_TOKEN,
              updates: {
                  enabled: true
              }
          });

async function processCommand(message) {
    switch (message.text) {
        case '/start':
            return await startCommand();
        case '/score':
            return await scoreCommand(message);
        case '/configure':
            return await configureCommand(message);
        case '/courses':
            return await coursesCommand();
        case '/tasks':
            return await tasksCommand();
    }
}

async function checkRegistration(message) {
    const user = await User.getTgUser(message.from.username);
    if (!user) return 'Oops... There is no registered user with such a telegram username.';
    if (message.text !== '/configure' && !user.telegram.chat_id)
        return 'Oops... Something went wrong. Try /configure to make this bot working.';
}

// /start
function startCommand() {
    return `***List of commands:***

/score - ___get your scores___
/courses - ___get list of available courses___
/tasks - ___get list of available tasks___
/configure - ___if you don't recieve notification___
/check - ___try to send me a notification___`;
}

// /scorE
function getAllCourses(solutions) {
    if (!solutions.length) return 'You have no solutions.';
    const courses = new Map();
    for (const solution of solutions)
        courses.set(solution.course.name, courses.get(solution.course.name) || 0 + solution.score);
    let str = 'Your score:\n\n';
    for (const course of courses.keys())
        str += `[${course}](https://progout.herokuapp.com/courses${course}): ${courses.get(
            course
        )}\n`;
    return str;
}

async function scoreCommand(message) {
    const user = await User.getTgUser(message.from.username);
    const solutions = await Solution.getAll({ user: user.id }, true);
    return getAllCourses(solutions);
}

// /configure
async function configureCommand(message) {
    const user = await User.getTgUser(message.from.username);
    user.telegram.chat_id = message.from.id;
    await user.save();
    return 'Everything is configured. Now you can use this bot!';
}

// /courses
async function coursesCommand() {
    const courses = await Course.getAll();
    if (!courses) return 'Empty list';
    let str = 'Courses list:\n\n';
    for (const course of courses)
        str += `[${course.name}](https://progout.herokuapp.com/courses/${course.name})\n`;
    return str;
}

// /tasks
async function tasksCommand() {
    const tasks = await Task.getAll();
    if (!tasks) return 'Empty list';
    let str = 'Tasks list:\n\n';
    for (const task of tasks)
        str += `[${task.name}](https://progout.herokuapp.com/tasks/${task.id_name})\n`;
    return str;
}

// /check
async function checkCommand(message) {
    const user = await User.getTgUser(message.from.username);
    if (!user.telegram.chat_id) return;
    await userBot.sendMessage({
        chat_id: user.telegram.chat_id,
        text: 'Success!'
    });
}

if (userBot)
    userBot.on('message', async message => {
        const text = (await checkRegistration(message)) || (await processCommand(message));
        if (text)
            await userBot.sendMessage({
                chat_id: message.from.id,
                text,
                parse_mode: 'markdown'
            });
        else if (message.text === '/check') await checkCommand(message);
    });

module.exports = {
    sendMessage: async (user, message) => {
        if (!userBot)
            return console.log(`\nMessage for \`${user.telegram.username}\`:\n` + message + '\n');
        if (!user.telegram.chat_id) return;
        await userBot.sendMessage({
            chat_id: user.telegram.chat_id,
            text: message,
            parse_mode: 'markdown'
        });
        return true;
    },

    notifyAdmin: async message => {
        if (!adminBot) return console.log('\nError:\n' + message + '\n');
        await adminBot.sendMessage({
            chat_id: process.env.ADMIN_CHAT_ID,
            text: message,
            parse_mode: 'markdown'
        });
    }
};
