const { default: axios } = require("axios");
const CONSTANTS = require("../constants");
const globalState = require("../globalState");
const FormData = require("form-data");


const discordSetTicketClosed = async (chatId) => {
    const url = `https://discord.com/api/channels/${globalState.getTicketId(chatId)}`;
    const ticketNumber = globalState.getServiceTicketNumber(chatId)

    try {

        if (!globalState.getPaid(chatId)) {
            const response = await axios.patch(
                url,
                { name: `closed-${ticketNumber}` },
                {
                    headers: {
                        'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`
                    }
                }
            );
        }

        console.log('ticket successfully closed');


    } catch (error) {
        console.error(`Error closing ticket: ${error.message}`);
    }


}

const discordSetTicketClaimed = async (chatId) => {
    const url = `https://discord.com/api/channels/${globalState.getTicketId(chatId)}`;
    const ticketNumber = globalState.getServiceTicketNumber(chatId);


    try {

        if (!globalState.getPaid(chatId)) {
            const response = await axios.patch(
                url,
                { name: `claimed-${ticketNumber}` },
                {
                    headers: {
                        'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`
                    }
                }
            );
        }

        console.log('ticket successfully claimed');


    } catch (error) {
        console.error(`Error claiming ticket: ${error.message}`);
    }

}

const discordSetTicketPaid = async (channelId, amount, user) => {


    const url = `https://discord.com/api/channels/${channelId}`;

    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.patch(
                url,
                { name: `${user}-${amount}` },
                {
                    headers: {
                        'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`
                    }
                }
            );

            console.log(`Successfully updated ticket to paid amount: $${amount}`);
            resolve('success')

        } catch (error) {
            console.error(`Error updating paid amount: ${error.message}`);
            reject('failed')
        }
    })
}


const discordSendEmbedMessageToChannel = async (channelId, embedContent) => {

    try {
        await axios.post(
            `https://discord.com/api/channels/${channelId}/messages`,
            {
                embed: embedContent,
            },
            {
                headers: {
                    'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

    } catch (error) {
        console.error(error);
    }

}

const discordSendMessageToChannel = async (channelId, messageContent, fileId = null, name) => {
    try {

        // TODO: Add support for sending pictures not just text
        if (fileId === null) {
            await axios.post(
                `https://discord.com/api/channels/${channelId}/messages`,
                {
                    content: `**${name}:** ${messageContent}`,
                },
                {
                    headers: {
                        'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        }
        else {

            console.log("user is trying to send a photo with file id: ", fileId)

            axios.get(`${CONSTANTS.TELEGRAM_API}/getFile?file_id=${fileId}`)
                .then(response => {
                    const filePath = response.data.result.file_path;
                    const url = `https://api.telegram.org/file/bot${CONSTANTS.TELEGRAM_API_TOKEN}/${filePath}`;

                    // Download the image
                    axios.get(url, { responseType: 'arraybuffer' })
                        .then(response => {
                            const buffer = Buffer.from(response.data, 'binary');

                            // Create form data
                            const formData = new FormData();
                            formData.append('file', buffer, { filename: 'image.jpg' });

                            // Send the image to Discord
                            axios.post(`https://discord.com/api/v8/channels/${channelId}/messages`, formData, {
                                headers: {
                                    ...formData.getHeaders(),
                                    'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`
                                },
                            }).then(response => {
                                console.log('Image sent to Discord');
                            }).catch(error => {
                                console.error('Error sending image to Discord:', error);
                            });
                        }).catch(error => {
                            console.error('Error downloading image from Telegram:', error);
                        });
                })
                .catch(error => {
                    console.error('Error getting file from Telegram:', error);
                });
        }

    } catch (error) {
        console.error(error);
    }
}


module.exports = { discordSetTicketClosed, discordSendEmbedMessageToChannel, discordSendMessageToChannel, discordSetTicketPaid, discordSetTicketClaimed }