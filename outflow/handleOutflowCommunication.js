const { Client, GatewayIntentBits, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const CONSTANTS = require("../constants");
const globalState = require("../globalState");
const { default: axios } = require("axios");
const { telegramSendMessage, telegramSendPhotoWithFormData } = require("../telegamAPI/telegramAPIWrapper");
const { discordSetTicketClosed, discordSetTicketPaid, discordSetTicketClaimed } = require("../discordAPI/discordAPIWrapper");
const FormData = require("form-data");
const routeState = require("../routeState");
const { saveRouteStatus, saveGlobalState, addRevenueToDatabase } = require("../database/utils");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const handleOutflowCommunication = async () => {

    client.once('ready', () => {
        console.log('Connection between inflow and outflow routes is established');
    });

    client.on('interactionCreate', async (interaction) => {

        console.log(interaction)

        let chatId = globalState.getDiscordChatId(interaction.channelId)

        if (interaction.isButton()) {
            await handleOutflowButtonCommands(chatId, interaction)
        }
        else if (interaction.isCommand()) {
            await handleOutflowSlashCommands(chatId, interaction)
        }
        else if (interaction.isStringSelectMenu()) {
            let customId = interaction.customId
            let route = interaction.values[0]


            if (routeState.getRoute(route).state === 'closed') {
                routeState.setRouteOpen(route)
                saveRouteStatus(route)
                await interaction.reply({
                    content: `successfully opened ${route} route`
                })
                return
            }

            routeState.setRouteClosed(route)
            saveRouteStatus(route)
            await interaction.reply({
                content: `successfully closed ${route} route`
            })
        }
    });


    client.on('messageCreate', async (message) => {

        let chatId = globalState.getDiscordChatId(message.channel.id)

        if (globalState.hasChatId(chatId) && globalState.getConnectedToAgent(chatId)) {
            if (message.author.id === CONSTANTS.DISCORD_APP_ID) {
                console.log(`Message was sent by the user: ${message.content}`);
            }
            else {

                const displayName = message.member ? (message.member.nickname || message.author.username) : message.author.username;

                if (!message.content.startsWith('.')) {
                    console.log(`Message was sent by a ${displayName}: ${message.content}`);
                    await telegramSendMessage(chatId, `<b>${displayName}: ${message.content}</b>`)

                    // Check if the message has any attachments
                    if (message.attachments.size > 0) {
                        for (let attachment of message.attachments.values()) {
                            try {
                                const response = await axios.get(attachment.url, {
                                    responseType: 'arraybuffer'
                                });
                                const buffer = Buffer.from(response.data, 'binary');
                                // Now you have the buffer, pass this to imageType and form.append

                                await telegramSendPhotoWithFormData(chatId, { source: buffer });
                            } catch (error) {
                                console.error(`Error while sending photo: ${error}`);
                            }
                        }
                    }
                }
                else {
                    try {
                        await message.react('🔒');
                    } catch (error) {
                        console.error('Failed to react to message:', error);
                    }
                }

            }
        }


    });


    client.login(CONSTANTS.DISCORD_BOT_TOKEN);
}

const handleOutflowSlashCommands = async (chatId, interaction) => {

    switch (interaction.commandName) {
        case "close":
            await performOutflowCloseCommand(chatId, interaction)
            break;
        case "open":
            await performOutflowOpenCommand(chatId, interaction)
            break;
        case "claim":
            await performOutflowClaimCommand(chatId, interaction)
            break;
        case "unclaim":
            await performOutflowUnclaimCommand(chatId, interaction)
            break;
        case "ping":
            await performOutflowPingCommand(chatId, interaction)
            break;
        case "paid":
            await performOutflowPaidCommand(interaction, chatId)
            break;
        case "service":
            await performOutflowRouteCommand(interaction, chatId)
            break
    }
}

const handleOutflowButtonCommands = async (chatId, interaction) => {
    const { customId } = interaction;

    switch (customId) {
        case 'claim':
            await performOutflowClaimCommand(chatId, interaction)
            break;
        case 'close':
            await performOutflowCloseCommand(chatId, interaction)
            break;
    }
}

const performOutflowClaimCommand = async (chatId, interaction) => {

    try {
        if (globalState.hasChatId(chatId)) {
            const { user } = interaction

            if (!globalState.getClaimed(chatId)) {

                const displayName = interaction.member.nickname || interaction.user.username;

                globalState.setClaimed(chatId, true)
                globalState.setClaimedBy(chatId, displayName)



                const embedClaimed = new EmbedBuilder()
                    .setColor('#37EF56')
                    .setDescription(`This ticket is now claimed by ${displayName}!`)
                    .setTimestamp()

                await Promise.all([
                    interaction.reply({ embeds: [embedClaimed] }),
                    discordSetTicketClaimed(chatId)
                ])
            }
            else {
                const embedClaimedBySomeoneElse = new EmbedBuilder()
                    .setColor('#F4FF71')
                    .setDescription(`This ticket is already claimed by ${globalState.getClaimedBy(chatId)}, you cannot claim it.`)
                    .setTimestamp()

                await interaction.reply({ embeds: [embedClaimedBySomeoneElse] });

            }
        }
        else {
            const ticketClosed = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`This ticket was already closed by a staff member`)
                .setTimestamp()

            await interaction.reply({ embeds: [ticketClosed] });
        }
    }
    catch (err) {
        console.error(err);
    }

}

const performOutflowUnclaimCommand = async (chatId, interaction) => {

    try {

        if (globalState.hasChatId(chatId)) {
            const { user } = interaction

            const embedUnclaimed = new EmbedBuilder()
                .setColor('#37EF56')
                .setDescription(`${globalState.getClaimedBy(chatId)} unclaimed the ticket!`)
                .setTimestamp()

            const claimedBySomeoneElse = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`This ticket is claimed by ${globalState.getClaimedBy(chatId)}, they need to unclaim it first!`)
                .setTimestamp()

            const claimedByNobody = new EmbedBuilder()
                .setColor('#F4FF71')
                .setDescription(`This ticket is not claimed by anyone, type /claim or click the button to claim it!`)
                .setTimestamp()

            const displayName = interaction.member.nickname || interaction.user.username;

            if (globalState.getClaimed(chatId) && (globalState.getClaimedBy(chatId) === displayName)) {
                globalState.setClaimed(chatId, false)
                globalState.setClaimedBy(chatId, null)

                await interaction.reply({ embeds: [embedUnclaimed] });

            }
            else if (globalState.getClaimedBy(chatId) && (globalState.getClaimedBy(chatId) !== displayName)) {
                await interaction.reply({ embeds: [claimedBySomeoneElse] });
            }
            else {
                await interaction.reply({ embeds: [claimedByNobody] });
            }
        }
        else {
            const ticketClosed = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`This ticket was already closed by a staff member`)
                .setTimestamp()

            await interaction.reply({ embeds: [ticketClosed] });
        }

    }
    catch (err) {
        console.error(err);
    }

}

const performOutflowPingCommand = async (chatId, interaction) => {

    const { user } = interaction

    try {

        const displayName = interaction.member.nickname || interaction.user.username;

        if (globalState.hasChatId(chatId)) {
            let messageContent = `👋 Hey ${globalState.getName(chatId)}, ${displayName} is pinging you!`
            await telegramSendMessage(chatId, messageContent)

            const successfulPing = new EmbedBuilder()
                .setColor('#F4FF71')
                .setDescription(`You successfully pinged ${globalState.getName(chatId)}!`)
                .setTimestamp()

            await interaction.reply({ embeds: [successfulPing] });
        }
        else {
            const ticketClosed = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`This ticket was already closed by a staff member`)
                .setTimestamp()

            await interaction.reply({ embeds: [ticketClosed] });
        }

    }
    catch (err) {
        console.error(err);
    }


}


const performOutflowCloseCommand = async (chatId, interaction) => {

    try {

        const displayName = interaction.member.nickname || interaction.user.username;

        if (globalState.hasChatId(chatId) && globalState.getConnectedToAgent(chatId)) {

            await telegramSendMessage(chatId, "<i>Ticket is being closed by a staff member. </i>")

            await Promise.all([
                await outflowCloseTicket(chatId),
                await telegramSendMessage(chatId, "<i>Successfully ⛔️ closed ⛔️. To start a new one, please type /start</i>"),
            ])

            await telegramSendMessage(this.chatId, "<b>Thank you for choosing Pepe's B4U!</b>\n\n We sincerely appreciate your trust in us. If you were satisfied with our service, we'd be immensely grateful if you could leave a vouch once your order arrives in this section https://t.me/c/1851027024/21 . Your support helps us grow and serve customers like you even better.\n\n If you encountered any issues or were mistreated please contact @PepeTheFirst immediately")

            const embedClosed = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`Ticket has been successfully closed by ${displayName}!`)
                .setTimestamp()

            await interaction.reply({ embeds: [embedClosed] })

            globalState.setConnectedToAgent(chatId, false)

        }
        else {
            const ticketClosed = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`This ticket was already closed by a staff member`)
                .setTimestamp()

            await interaction.reply({ embeds: [ticketClosed] });
        }

    }
    catch (err) {
        console.error(err)
    }


}


const performOutflowOpenCommand = async (chatId, interaction) => {

    try {


        if (globalState.hasChatId(chatId) && globalState.getTicketId(chatId) === interaction.channelId) {

            await telegramSendMessage(chatId, "<i>Ticket is being re-opened by a staff member. </i>")

            globalState.setConnectedToAgent(chatId, true)

            const embedOpen = new EmbedBuilder()
                .setColor('#008000')
                .setDescription(`Ticket has been successfully re-opened!`)
                .setTimestamp()

            await interaction.reply({ embeds: [embedOpen] })

        }
        else {

            const ticketCannotBeOpened = new EmbedBuilder()
                .setColor('#EF3737')
                .setDescription(`Unable to re-open ticket, user has initiated a new one with the bot`)
                .setTimestamp()

            await interaction.reply({ embeds: [ticketCannotBeOpened] });
        }

    }
    catch (err) {
        console.error(err)
    }


}

const outflowCloseTicket = async (chatId) => {

    await discordSetTicketClosed(chatId)
    globalState.setConnectedToAgent(chatId, false)
    saveGlobalState()

    console.log("Successfully removed user from global state with chatID: ", chatId)
}

const performOutflowPaidCommand = async (interaction) => {
    try {

        let channelId = interaction.channelId
        let chatId = globalState.getDiscordChatId(channelId);
        const displayName = interaction.member.nickname || interaction.user.username;
        const amount = interaction.options.getString('paid');


        await Promise.all([
            discordSetTicketPaid(channelId, amount, displayName),
            addRevenueToDatabase(channelId, amount, displayName)
        ])

        await discordSetTicketPaid(channelId, amount, displayName)
        globalState.setPaid(chatId, true)



        const embed = new EmbedBuilder()
            .setColor('#37EF56')
            .setDescription(`Ticket has been successfully marked as paid!`)
            .setTimestamp()

        await interaction.reply({ embeds: [embed] });

    }
    catch (error) {
        console.error(error)
        const embed = new EmbedBuilder()
            .setColor('#EF3737')
            .setDescription(`Ticket could not be updated, wait 5 minutes and try again`)
            .setTimestamp()

        await interaction.reply({ embeds: [embed] });
    }

}

const performOutflowRouteCommand = async (interaction) => {
    let option = interaction.options.getString('action')
    console.log(`Performing route command ${option}`)

    switch (option) {
        case 'open':
            await performOutflowOpenRoute(interaction)
            break;
        case 'close':
            await performOutflowCloseRoute(interaction)
            break;
    }
}

const performOutflowCloseRoute = async (interaction) => {

    let openRoutes = routeState.getOpenRoutes()
    console.log("open routes: ", openRoutes)

    if (openRoutes.length === 0) {
        await interaction.reply({
            content: 'All Routes are currently Closed!',
        });
        return
    }

    openRoutes = openRoutes.map(route => selectMenuOptionBuilder(route, route))

    const select = new StringSelectMenuBuilder()
        .setCustomId('starter')
        .setPlaceholder('Make a selection!')
        .addOptions(...openRoutes)

    const row = new ActionRowBuilder()
        .addComponents(select);

    await interaction.reply({
        content: 'Select Route to Close!',
        components: [row],
        ephemeral: true
    });
}

const performOutflowOpenRoute = async (interaction) => {

    let closedRoutes = routeState.getClosedRoutes()
    console.log("closed routes: ", closedRoutes)

    if (closedRoutes.length === 0) {
        await interaction.reply({
            content: 'All Routes are currently Open!',
            ephemeral: true
        });
        return
    }

    closedRoutes = closedRoutes.map(route => selectMenuOptionBuilder(route, route))



    const select = new StringSelectMenuBuilder()
        .setCustomId('starter')
        .setPlaceholder('Make a selection!')
        .addOptions(...closedRoutes)

    const row = new ActionRowBuilder()
        .addComponents(select);

    await interaction.reply({
        content: 'Select Route to Open!',
        components: [row],
        ephemeral: true
    });
}

const selectMenuOptionBuilder = (label, value, description = "route") => {
    return new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setDescription(description)
        .setValue(value)
}

module.exports = { handleOutflowCommunication }