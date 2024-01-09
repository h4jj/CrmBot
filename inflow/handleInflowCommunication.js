const { default: axios } = require("axios")
const CONSTANTS = require("../constants")
const globalState = require("../globalState")
const { performRoute, promptQuestions } = require("./inflowRoute")
const { telegramSendPhotoWithReplyMarkup, telegramSendMessage } = require("../telegamAPI/telegramAPIWrapper")
const { discordSetTicketClosed, discordSendEmbedMessageToChannel, discordSendMessageToChannel } = require("../discordAPI/discordAPIWrapper")
const { EmbedBuilder } = require("discord.js")
const { saveGlobalState } = require("../database/utils")
const CommandController = require("./CommandController")

const handleInflowCommunication = async (req) => {

    try {
        if (req.body.message) {

            let message = req.body.message
            let chatId = req.body.message?.chat.id.toString()
            let text = req.body.message.text
            let name = `${req.body.message.chat.first_name || ""}`

            if (!globalState.hasChatId(chatId)) {
                globalState.setUserState(chatId)
                globalState.setName(chatId, name)
                console.log("Successfully updated global state: ", globalState.getGlobalState())
            }

            if (CommandController.AVAILABLE_COMMANDS.includes(text)) {

                const commandController = new CommandController(text, chatId)
                commandController.handleCommand(name)

            }
            else if (globalState.getConnectedToAgent(chatId)) {
                if (globalState.getTicketId(chatId)) {
                    let fileId = message.photo ? message.photo[message.photo.length - 1].file_id : null
                    discordSendMessageToChannel(globalState.getTicketId(chatId), text, fileId, globalState.getName(chatId))
                }
            }
            else if (globalState.getQuestionsActive(chatId)) {
                globalState.addPropertyToTicketInformation(chatId, globalState.getQuestionPointer(chatId), text)
                await promptQuestions(chatId)
            }
        }
        else if (req.body.callback_query) {
            const chatId = req.body.callback_query.message.chat.id.toString()
            const route = req.body.callback_query.data;

            if (globalState.getQuestionsActive(chatId) || globalState.getConnectedToAgent(chatId)) {
                await telegramSendMessage(
                    chatId,
                    "<i>🤕 If you're trying to select a different service, please request to close your ticket first with /close</i>"
                )
            }
            else {
                globalState.setTicketType(chatId, route)
                globalState.setQuestionsActive(chatId, true)
                await performRoute(chatId)
                await promptQuestions(chatId)
            }
        }
        else {

        }
    }
    catch (err) {
        console.error(err);
    }

}



module.exports = { handleInflowCommunication }

