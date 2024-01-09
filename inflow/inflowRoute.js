const axios = require('axios');

const CONSTANTS = require('../constants');
const globalState = require('../globalState');
const { telegramSendMessage, telegramSendPhoto } = require('../telegamAPI/telegramAPIWrapper');
const { createTicket } = require('../outflow/outflowRoute');
const routeState = require('../routeState');
const { ActivityFlagsBitField } = require('discord.js');



const promptQuestions = async (chatId) => {

    let route = routeState.getRoute(globalState.getTicketType(chatId))
    let questions = route.questions
    let lengthOfQuestions = questions.length;
    let ticketInformation = globalState.getTicketInformation(chatId)
    let questionAsked = false

    if (route.state === 'closed') {
        await telegramSendMessage(
            chatId,
            route.closedMessage
        )
        globalState.deleteChatId(chatId)

        return
    }
    else if (route.state === 'unavailable') {
        await telegramSendMessage(
            chatId,
            route.unavailableMessage
        )
        globalState.deleteChatId(chatId)

        return
    }

    try {
        for (let obj of questions) {
            for (let key in obj) {
                if (!ticketInformation.hasOwnProperty(key) && !questionAsked) {
                    await telegramSendMessage(
                        chatId,
                        obj[key]
                    )
                    questionAsked = true
                    globalState.setQuestionPointer(chatId, key)
                }
            }
        }
    }
    catch (err) {
        console.error(err)
    }



    if (lengthOfQuestions === Object.keys(ticketInformation).length) {
        console.log("all questions prompted, creating ticket...")
        globalState.setQuestionsActive(chatId, false)
        await createTicket(chatId)
    }

}

const performRoute = async (chatId) => {

    let route = routeState.getRoute(globalState.getTicketType(chatId))

    await telegramSendPhoto(
        chatId,
        route.photoUrl,
        route.photoCaption
    )

}


module.exports = { promptQuestions, performRoute }