const express = require('express');
const bodyParser = require('body-parser');

const CONSTANTS = require('./constants');
const port = process.env.PORT || 3000;


const { handleInflowCommunication } = require('./inflow/handleInflowCommunication');
const { establishTicketsDatabaseConnection } = require('./database/utils');
const { telegramSetWebhook } = require('./telegamAPI/telegramAPIWrapper');
const { handleOutflowCommunication } = require('./outflow/handleOutflowCommunication');
const routeState = require('./routeState');

const app = express()
app.use(bodyParser.json())


const init = async () => {
    await Promise.all([
        telegramSetWebhook(),
        establishTicketsDatabaseConnection(),
        handleOutflowCommunication(),
    ])
}


app.listen(port, async () => {
    console.log(`listening on port ${port}...`)
    await init()

})


app.post(CONSTANTS.URI, async (req, res) => {

    try {
        handleInflowCommunication(req)
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.log('Caught exception:', err, 'Exception origin:', origin);
});

