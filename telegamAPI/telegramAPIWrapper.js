const { default: axios } = require("axios");
const CONSTANTS = require("../constants");
const FormData = require("form-data");


const telegramSendMessage = async (chatId, messageContent) => {
    try {
        await axios.post(`${CONSTANTS.TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: messageContent,
            parse_mode: 'HTML'
        })
    }
    catch (err) {
        console.error(err);
    }
}

const telegramSendPhotoWithReplyMarkup = async (chatId, photoUrl, caption, replyMarkup) => {

    try {
        await axios.post(`${CONSTANTS.TELEGRAM_API}/sendPhoto`, {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        });
    }
    catch (err) {
        console.error(err);
    }
}

const telegramSendPhoto = async (chatId, photoUrl, caption) => {
    try {
        await axios.post(`${CONSTANTS.TELEGRAM_API}/sendPhoto`, {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption,
            parse_mode: 'HTML'
        });
    }
    catch (err) {
        console.error(err);
    }
}


const telegramSendPhotoWithFormData = async (chatId, photoBuffer) => {
    try {
        const form = new FormData();
        const imageTypeModule = await import('image-type');
        const type = imageTypeModule.default(photoBuffer.source);
        form.append('chat_id', chatId);
        form.append('photo', photoBuffer.source, `photo.${type.ext}`);

        await axios.post(`https://api.telegram.org/bot${CONSTANTS.TELEGRAM_API_TOKEN}/sendPhoto`, form, {
            headers: form.getHeaders(),
        });
    } catch (error) {
        console.error(error);
    }
};


const telegramSetWebhook = async () => {
    try {
        axios.get(`${CONSTANTS.TELEGRAM_API}/setWebhook?url=${CONSTANTS.WEBHOOK_URL}`)
            .then(res => console.log(res.data))
            .catch(err => {
                console.log(err)
            })
    }
    catch (err) {
        console.error(err);
    }

}

module.exports = { telegramSendMessage, telegramSendPhoto, telegramSetWebhook, telegramSendPhotoWithReplyMarkup, telegramSendPhotoWithFormData }