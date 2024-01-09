const CONSTANTS = {
    MONGO_USER: "robxnhood1",
    MONGO_PASS: "7wqYI4IV4Hzff2Bf",
    DB: 'pepe',
    TELEGRAM_API_TOKEN: "6277295133:AAGQK4WlUiVK7jPjyusN40kfWzQ_PbKln3k",
    SERVER_URL: "https://pepe-system-c453f8afa895.herokuapp.com",
    DISCORD_BOT_TOKEN: "MTExOTY4MzE2MzI1MDI0MTU5Ng.GAf9EV.UgZdlHLxE1DxvDdkIcIlERvHBfvhCyKnJTlcqc",
    GUILD_ID: "1119691674365472922",
    DISCORD_APP_ID: "1119683163250241596",
    GROUP_ICON_URL: "https://i.imgur.com/ToysI49.gif",
    PEPE_ICON_URL: "https://i.imgur.com/ToysI49.gif",
}

CONSTANTS.MONGO_TICKETS_URI = `mongodb+srv://${CONSTANTS.MONGO_USER}:${CONSTANTS.MONGO_PASS}@ticketing-system-datast.cqcu1fg.mongodb.net/${CONSTANTS.DB}?retryWrites=true&w=majority`
CONSTANTS.TELEGRAM_API = `https://api.telegram.org/bot${CONSTANTS.TELEGRAM_API_TOKEN}`
CONSTANTS.URI = `/webhook/${CONSTANTS.TELEGRAM_API_TOKEN}`
CONSTANTS.WEBHOOK_URL = CONSTANTS.SERVER_URL + CONSTANTS.URI



module.exports = CONSTANTS