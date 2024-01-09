const CONSTANTS = require("./constants");

const freshUserState = () => {
    return {
        connectedToAgent: false,
        questionsActive: false,
        ticketId: null,
        ticketType: null,
        serviceTicketNumber: null,
        name: null,
        paid: false,
        claimedBy: null,
        claimed: false,
        questionPointer: null,
        ticketInformation: {
        },

    }
}

let globalState = new Map()


module.exports = {
    getGlobalState: () => {
        return globalState
    },
    setGlobalState: (newGlobalState) => {
        Object.entries(newGlobalState).forEach(item => {
            globalState.set(item[0], item[1])
        })
        console.log("Successfully set new global state")
    },
    hasChatId: (chatId) => {
        if(globalState.has(chatId)) return true;
        return false;
    },
    setUserState: (chatId) => {
        globalState.set(chatId, freshUserState())
    },
    getUserState: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId)
        }
    },
    getConnectedToAgent: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId).connectedToAgent
        }
    },
    setConnectedToAgent: (chatId, connectedToAgent) => {
        if(globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.connectedToAgent = connectedToAgent
            globalState.set(chatId, userState)
        }
    },
    getQuestionsActive: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId).questionsActive
        }
    },
    setQuestionsActive: (chatId, questionsActive) => {
        if(globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.questionsActive = questionsActive
            globalState.set(chatId, userState)

            console.log("Successfully updated questions active for user with id: ", chatId)
        }        
    },
    getTicketInformation: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId).ticketInformation
        }
    },
    setTicketInformation: (chatId, ticketInformation) => {
        if(globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.ticketInformation = ticketInformation
            globalState.set(chatId, userState)
        }
    },
    addPropertyToTicketInformation: (chatId, key, value) => {
        if (globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            let newTicketInformation = { ...userState.ticketInformation }
            newTicketInformation[key] = value
            userState.ticketInformation = newTicketInformation
            globalState.set(chatId, userState)
        }
    },
    setTicketType: (chatId, ticketType) => {
        if(globalState.has(chatId)) {
            let userData = globalState.get(chatId)
            userData.ticketType = ticketType
            globalState.set(chatId, userData)
        
            console.log("Successfully updated ticket type for user with id: ", chatId)
        }        
    },
    getTicketType: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId).ticketType
        }
    },
    setTicketId: (chatId, ticketId) => {
        if(globalState.has(chatId)) {
            let userData = globalState.get(chatId)
            userData.ticketId = ticketId
            globalState.set(chatId, userData)
        
            console.log("Successfully updated ticket ID for user with id: ", chatId)
        }
    },
    getTicketId: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId).ticketId
        }
    },
    deleteChatId: (chatId) => {
        if(globalState.has(chatId)) {
            globalState.delete(chatId)
        }
    },
    setName: (chatId, name) => {
        if(globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.name = name
            globalState.set(chatId, userState)

            console.log("Successfully updated name for user with id: ", chatId)
        }
    },
    getName: (chatId) => {
        if(globalState.has(chatId)) {
            return globalState.get(chatId).name
        }
    },
    getClaimed: (chatId) => {
        if (globalState.has(chatId)) {
            return globalState.get(chatId).claimed
        }
    },
    setClaimed: (chatId, claimed) => {
        if (globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.claimed = claimed
            globalState.set(chatId, userState)

            console.log("ticket was successfully claimed for id: ", chatId)
        }
    },
    getClaimedBy: (chatId) => {
        if (globalState.has(chatId)) {
            return globalState.get(chatId).claimedBy
        }
    },
    setClaimedBy: (chatId, claimedBy) => {
        if (globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.claimedBy = claimedBy
            globalState.set(chatId, userState)

            console.log(`ticket for id ${chatId} was successfully claimed by ${claimedBy}`)
        }
    },
    getDiscordChatId: (channelId) => {
        for (let [chatId, userState] of globalState) {
            if (channelId === globalState.get(chatId).ticketId)
                return chatId
        }

        return null
    },
    setPaid: (chatId, paid) => {
        if (globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.paid = paid
            globalState.set(chatId, userState)

            console.log(`ticket for id ${chatId} was paid for`)
        }
    },
    getPaid: (chatId) => {
        if (globalState.has(chatId)) {
            return globalState.get(chatId).paid
        }
    },
    setQuestionPointer: (chatId, questionPointer) => {
        if (globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.questionPointer = questionPointer
            globalState.set(chatId, userState)

            console.log(`ticket for id ${chatId} was paid for`)
        }
    },
    getQuestionPointer: (chatId) => {
        if (globalState.has(chatId)) {
            return globalState.get(chatId).questionPointer
        }
    },
    setServiceTicketNumber: (chatId, serviceTicketNumber) => {
        if (globalState.has(chatId)) {
            let userState = globalState.get(chatId)
            userState.serviceTicketNumber = serviceTicketNumber
            globalState.set(chatId, userState)
        }
    },
    getServiceTicketNumber: (chatId) => {
        if (globalState.has(chatId)) {
            return globalState.get(chatId).serviceTicketNumber
        }
    }
}