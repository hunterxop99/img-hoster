require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const FREEIMAGE_API_KEY = process.env.FREEIMAGE_API_KEY;
const UPLOAD_URL = 'https://freeimage.host/api/1/upload';

const bot = new Telegraf(BOT_TOKEN);

// Upload animation frames
const UPLOAD_ANIMATIONS = [
    "📤 Uploading [▱▱▱▱▱▱▱▱▱▱]",
    "📤 Uploading [▰▱▱▱▱▱▱▱▱▱]",
    "📤 Uploading [▰▰▱▱▱▱▱▱▱▱]",
    "📤 Uploading [▰▰▰▱▱▱▱▱▱▱]",
    "📤 Uploading [▰▰▰▰▱▱▱▱▱▱]",
    "📤 Uploading [▰▰▰▰▰▱▱▱▱▱]",
    "📤 Uploading [▰▰▰▰▰▰▱▱▱▱]",
    "📤 Uploading [▰▰▰▰▰▰▰▱▱▱]",
    "📤 Uploading [▰▰▰▰▰▰▰▰▱▱]",
    "📤 Uploading [▰▰▰▰▰▰▰▰▰▱]",
    "📤 Uploading [▰▰▰▰▰▰▰▰▰▰]"
];

bot.start((ctx) => {
    ctx.reply(
        '🔥 Welcome to Image Hoster Bot! 🔥\n\n📸 Send me an image, and I\'ll host it for you!\n\n #FreeForever | Made In INDIA 🇮🇳',
        Markup.inlineKeyboard([
            [Markup.button.url('👨‍💻 Developer', 'https://t.me/X0557')],
            [Markup.button.url('🔔 Updates', 'https://t.me/TER4_PAPA')]
        ])
    );
});

bot.on('photo', async (ctx) => {
    try {
        const photo = ctx.message.photo.pop();
        const fileId = photo.file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const filePath = `./temp_${Date.now()}.jpg`;

        let message = await ctx.reply(UPLOAD_ANIMATIONS[0]);

        for (let i = 1; i < UPLOAD_ANIMATIONS.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, null, UPLOAD_ANIMATIONS[i]);
        }

        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            https.get(fileLink.href, (response) => {
                response.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', reject);
            }).on('error', reject);
        });

        const form = new FormData();
        form.append('source', fs.createReadStream(filePath));
        form.append('key', FREEIMAGE_API_KEY);
        form.append('format', 'json');

        const res = await axios.post(UPLOAD_URL, form, { headers: form.getHeaders() });
        fs.unlinkSync(filePath);

        if (res.data.image && res.data.image.url) {
            const uploadUrl = res.data.image.url.replace(/[-.]/g, '\\$&'); // Escape MarkdownV2 special characters
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                message.message_id,
                null,
                `✅ Image uploaded successfully!\n\n Hosted URL : ${res.data.image.url} \n\n For hosting another image, just send it!`,
                { parse_mode: 'Markdown' }
            );
            
        } else {
            await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, null, '❌ Failed to get the image URL.');
        }
    } catch (error) {
        console.error(error);
        ctx.reply('❌ Image upload failed! Please try again later.');
    }
});

bot.launch();
console.log('🚀 Bot is running!');
