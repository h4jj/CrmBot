const axios = require('axios');
const CONSTANTS = require('../constants');
const globalState = require('../globalState');
const { EmbedBuilder } = require('discord.js');
const { saveRouteStatus, saveGlobalState } = require('../database/utils');
const { telegramSendMessage } = require('../telegamAPI/telegramAPIWrapper');
const { discordSendEmbedMessageToChannel, discordSetTicketClosed } = require('../discordAPI/discordAPIWrapper');
const routeState = require('../routeState');


const createTicket = async (chatId, text = null) => {

    await telegramSendMessage(chatId, "<i>🕒 You're being connected to our staff team!</i>")
    let result = null

    try {
        let response = await axios.get(`https://discord.com/api/guilds/${CONSTANTS.GUILD_ID}/channels`, {
            headers: {
                'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,

            }
        });

        let desiredCategory = response.data.filter(item => item.name.toLowerCase() === globalState.getTicketType(chatId).toLowerCase())

        if (desiredCategory.length > 0) {
            desiredCategory = desiredCategory[0]
            desiredCategoryId = desiredCategory.id

            const channelId = await createDiscordChannel(desiredCategoryId, chatId)

            let fields = []
            let index = 1;

            for (let key in globalState.getTicketInformation(chatId)) {
                let fieldItem = {}
                fieldItem.name = `\`${index}.\`  ${key}`
                fieldItem.value = ` \`\`\`${globalState.getTicketInformation(chatId)[key]}\`\`\` `
                fields.push(fieldItem)

                index += 1
            }

            const embedContent = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${globalState.getName(chatId)}'s ${globalState.getTicketType(chatId)} ticket`)
                .setAuthor({ name: 'Pepe\'s Ticketing System', iconURL: CONSTANTS.PEPE_ICON_URL })
                .addFields(...fields)
                .setImage(CONSTANTS.GROUP_ICON_URL)
                .setTimestamp()

            await discordSendEmbedMessageToChannel(channelId, embedContent)
            await sendButtonsToDiscordChannel(channelId, "")

            globalState.setConnectedToAgent(chatId, true)
            globalState.setTicketId(chatId, channelId)

            await Promise.all([
                saveGlobalState(),
                telegramSendMessage(chatId, "<i>✅ You're now connected to our staff team!</i>")
            ])
        }
        else {
            await telegramSendMessage(chatId, "<i>There was an issue connecting you with our agents, please try again. If this persists contact @PepeTheDeveloper</i>")
            console.log("Category could not be found!")
        }

    } catch (error) {
        console.error(error);
        await telegramSendMessage(chatId, "<i>There was an issue connecting you with our agents, please try again. If this persists contact @PepeTheDeveloper</i>")

    }
}

const closeTicket = async (chatId) => {

    try {

        const embedContent = new EmbedBuilder()
            .setTitle("The user has ⛔️ closed ⛔️ the ticket")
            .setColor(0x0099FF)
            .setTimestamp()

        await discordSetTicketClosed(chatId)
        await discordSendEmbedMessageToChannel(globalState.getTicketId(chatId), embedContent)

        console.log('ticket successfully closed');

    } catch (error) {
        console.error(`Error closing ticket: ${error.message}`);
    }
};


const createDiscordChannel = async (categoryId, chatId) => {

    return new Promise(async (resolve, reject) => {

        const ticketNumber = routeState.getRoute(globalState.getTicketType(chatId)).ticketNumber

        try {
            await axios.post(
                `https://discord.com/api/guilds/${CONSTANTS.GUILD_ID}/channels`,
                {
                    name: `ticket-${ticketNumber}`,
                    type: 0, // 0 is a text channel
                    parent_id: categoryId,
                },
                {
                    headers: {
                        'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
                .then(async (res) => {

                    let ticketType = globalState.getTicketType(chatId)
                    globalState.setServiceTicketNumber(chatId, ticketNumber)
                    let desiredRoute = routeState.getRoute(globalState.getTicketType(chatId))
                    desiredRoute.ticketNumber += 1
                    saveRouteStatus(ticketType)

                    resolve(res.data.id)
                })
                .catch(err => {
                    reject("id does not exist")
                    console.log(err)
                })

        } catch (error) {
            console.log("Could not create channel")
            console.error(error);
        }
    })
}

const sendButtonsToDiscordChannel = async (channelId, messageContent) => {
    try {

        const buttons = [
            { label: 'Claim', custom_id: 'claim', style: 1 },
            { label: 'Close', custom_id: 'close', style: 4 }
        ]

        const components = buttons.map(button => ({
            type: 2,
            label: button.label,
            style: button.style || 1,
            custom_id: button.custom_id
        }));

        const response = await axios.post(
            `https://discord.com/api/channels/${channelId}/messages`,
            {
                content: messageContent,
                components: [
                    {
                        type: 1,
                        components: components
                    }
                ]
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



module.exports = { createTicket, closeTicket }