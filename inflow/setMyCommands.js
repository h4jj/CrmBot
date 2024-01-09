const fetch = require('node-fetch');
const CONSTANTS = require('../constants');


const commands = [
    { command: '/start', description: 'Place an order with us' },
    { command: '/close', description: 'Close current ticket' },
    { command: '/ping', description: 'Ping a staff member to get their attention!' },
    { command: '/help', description: 'Show help information' },
];

const setMyCommands = async () => {

    await fetch(`${CONSTANTS.TELEGRAM_API}/setMyCommands`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            commands: commands,
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(err => console.log(err));
}

(async => (
    setMyCommands()
))()

