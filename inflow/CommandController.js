const CONSTANTS = require("../constants");
const globalState = require("../globalState");
const { telegramSendMessage, telegramSendPhotoWithReplyMarkup } = require("../telegamAPI/telegramAPIWrapper");
const { closeTicket } = require("../outflow/outflowRoute.js");
const routeState = require("../routeState");
const { EmbedBuilder } = require("discord.js");
const { saveGlobalState } = require("../database/utils");


class CommandController {

    static AVAILABLE_COMMANDS = ["/start", "/close", "/help", "/ping"]

    constructor(command, chatId) {
        this.command = command
        this.chatId = chatId
    }

    async handleCommand(name) {


        switch (this.command) {
            case "/start":
                await this.performOrderCommand(name)
                break;
            case "/close":
                await this.performCloseCommand()
                break;
            case "/ping":
                await this.performPingCommand()
                break;
            case "/help":
                await this.performHelpCommand();
                break;
        }
    }

    async performOrderCommand(name) {

        try {

            if (!globalState.getConnectedToAgent(this.chatId) && !globalState.getQuestionsActive(this.chatId)) {
                // Prepare the inline keyboard

                globalState.setUserState(this.chatId)
                globalState.setName(this.chatId, name)
                let openRoutes = routeState.getOpenRoutes()


                const inlineKeyboard = {
                    inline_keyboard: [
                        [
                            { text: `Doordash $30+ 50% off 🇺🇸🍟 ${openRoutes.includes('small-dd') ? "🟢" : "🔴"}`, callback_data: "small-dd" },
                        ],
                        [
                            { text: `Big Doordash $80+ 60% off 🇺🇸🍟 ${openRoutes.includes('big-dd') ? "🟢" : "🔴"}`, callback_data: "big-dd" },
                        ],
                        [
                            { text: `Doordash $35+ 50% off 🇨🇦🍟 ${openRoutes.includes('small-dd-can') ? "🟢" : "🔴"}`, callback_data: "small-dd-can" },
                        ],
                        [
                            { text: `Big Doordash $90+ 60% off 🇨🇦🍟 ${openRoutes.includes('big-dd-can') ? "🟢" : "🔴"}`, callback_data: "big-dd" },
                        ],
                        [
                            { text: `Grubhub $35+ 55% off 🇺🇸🍔 ${openRoutes.includes('grubhub') ? "🟢" : "🔴"}`, callback_data: "grubhub" },
                        ],
                        [
                            { text: `Instacart B4U 50% off 🇺🇸🥗 ${openRoutes.includes('instacart') ? "🟢" : "🔴"}`, callback_data: 'instacart' },
                        ],
                        [
                            { text: `Store Refunds 80% off 🌍 ${openRoutes.includes('store') ? "🟢" : "🔴"}`, callback_data: "store" },
                        ],
                    ],
                };

                await telegramSendPhotoWithReplyMarkup(
                    this.chatId,
                    CONSTANTS.GROUP_ICON_URL,
                    "<b>Welcome To Pepe's B4U</b>\n\n"

                    + "🟢 Service is open and you can place your order\n"
                    + "🔴 Service is currently closed check back later\n\n"

                    + "Click a service below to get started!",
                    JSON.stringify(inlineKeyboard)
                )
            }
            else {
                await telegramSendMessage(
                    this.chatId,
                    "<i>🤕 If you're trying to run a command, please request to close your ticket first with /close</i>"
                )
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    async performCloseCommand() {


        try {

            if (globalState.hasChatId(this.chatId)) {
                if (!globalState.getQuestionsActive(this.chatId) && !globalState.getConnectedToAgent(this.chatId)) {
                    await telegramSendMessage(
                        this.chatId,
                        "<i>❔ You don't currently have an open ticket, and you aren't currently in a series of questions.</i>"
                    )
                    globalState.deleteChatId(this.chatId)
                    console.log("Successfully removed user from global state with chatID: ", this.chatId)
                }
                else if (globalState.getQuestionsActive(this.chatId) && !globalState.getConnectedToAgent(this.chatId)) {

                    await Promise.all([
                        await closeTicket(this.chatId),
                        await telegramSendMessage(
                            this.chatId,
                            "<b>Cancelled, leaving!</b> Start a conversation with us again by clicking /start"
                        )
                    ])

                    console.log("Successfully removed user from global state with chatID: ", this.chatId)
                    globalState.deleteChatId(this.chatId)
                }
                else {

                    await telegramSendMessage(
                        this.chatId,
                        "<i>This ticket is now being closed, please wait a moment...</i>"
                    )

                    await Promise.all([
                        await closeTicket(this.chatId),
                        await telegramSendMessage(
                            this.chatId,
                            "<i>You have successfully ⛔️ closed ⛔️ this ticket. To start a new one, please type /start</i>"
                        )
                    ])


                    await telegramSendMessage(this.chatId, "<b>Thank you for choosing Pepe's B4U!</b>\n\n We sincerely appreciate your trust in us. If you were satisfied with our service, we'd be immensely grateful if you could leave a vouch once your order arrives in this section https://t.me/c/1851027024/21 . Your support helps us grow and serve customers like you even better.\n\n If you encountered any issues or were mistreated please contact @PepeTheFirst immediately")


                    console.log("Successfully removed user from global state with chatID: ", this.chatId)
                    globalState.setConnectedToAgent(this.chatId, false)
                    saveGlobalState()
                }
            }

        }
        catch (err) {
            console.error(err);
        }


    }

    async performPingCommand() {

        try {
            if (globalState.getConnectedToAgent(this.chatId)) {

                const embedContent = new EmbedBuilder()
                    .setTitle(`${globalState.getName(this.chatId)} is pinging you!`)
                    .setColor(0x0099FF)
                    .setTimestamp()

                await Promise.all([
                    telegramSendMessage(this.chatId, "<b>You have successfully pinged a staff member 🟢</b>"),
                    discordSendEmbedMessageToChannel(globalState.getTicketId(this.chatId), embedContent)
                ])
            }
            else {
                telegramSendMessage(this.chatId, "<b>You can only ping an agent once a ticket is open 🔴 </b>")
            }
        }
        catch (err) {
            console.error(err);
        }

    }

    async performHelpCommand() {

        try {

            await telegramSendMessage(this.chatId, "If you are facing any issues while using the bot please try using /close then /start. If the issues persist contact @PepeTheDeveloper\n\n For General order inquiries contact @PepeTheFirst")
        }
        catch (err) {
            console.error(err);
        }

    }
}

module.exports = CommandController;