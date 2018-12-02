const telegram = require('telegram-bot-api');
const mongoose = require('mongoose');

const adminBot = process.env.LOCAL
    ? null
    : new telegram({
          token: process.env.ADMIN_BOT_TOKEN
      });

const userBot = process.env.LOCAL
    ? null
    : new telegram({
          token: process.env.USER_BOT_TOKEN,
          updates: {
              enabled: true
          }
      });

if (userBot)
    userBot.on('message', async message => {
        const user = await mongoose.model('User').findOne({
            'telegram.username': message.from.username
        });
        const text = user
            ? "Ваша інформація була успішно оновлена. Якщо у нас з'являться новини для вас - ми надішлемо їх вам цим ботом!"
            : 'На жаль, ви не зареєстровані у нас.\nЩоб отримувати сповіщення, додайте свій телеграм-юзернейм на [сторінці редагування профілю](https://progout.herokuapp.com/profile';

        if (user) {
            user.telegram.chat_id = message.from.id;
            await user.save();
        }
        await userBot.sendMessage({
            chat_id: message.from.id,
            text,
            parse_mode: 'markdown'
        });
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
