const { SlashCommandBuilder } = require('discord.js');
const CONSTANTS = require('../constants');
const { default: fetch } = require('node-fetch');

const closeCommand = new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket!')

const openCommand = new SlashCommandBuilder()
    .setName("open")
    .setDescription("Re-open the current ticket!")


const claimCommand = new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim current ticket!')

const unClaimCommand = new SlashCommandBuilder()
    .setName('unclaim')
    .setDescription('Unclaim current ticket!')

const paidCommand = new SlashCommandBuilder()
    .setName('paid')
    .setDescription('Update this ticket to a paid ticket!')
    .addStringOption(option =>
        option.setName("paid")
            .setDescription("the amount the has been paid")
            .setRequired(true)
    )


const pingCommand = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the customer to get their attention")


const routeCommmand = new SlashCommandBuilder()
    .setName('service')
    .setDescription('Open or close a service!')
    .addStringOption(option =>
        option.setName("action")
            .setDescription("Select whether to open or close a service")
            .setRequired(true)
            .addChoices(
                { name: 'Open', value: 'open' },
                { name: 'Close', value: 'close' }
            )
    )

const commands = [
    paidCommand.toJSON(),
    routeCommmand.toJSON(),
    closeCommand.toJSON(),
    openCommand.toJSON(),
    pingCommand.toJSON(),
    claimCommand.toJSON(),
    unClaimCommand.toJSON()
]


const setCommands = async (commands) => {

    commands.forEach(command => {
        fetch(`https://discord.com/api/v8/applications/${CONSTANTS.DISCORD_APP_ID}/commands`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(command)
        })
            .then(res => res.json())
            .then(res => console.log(res))
            .catch(err => {
                console.error(err)
            })
    })

}


const deleteCommand = async (commandId) => {

    fetch(`https://discord.com/api/v8/applications/${CONSTANTS.DISCORD_APP_ID}/guilds/${CONSTANTS.GUILD_ID}/commands/${commandId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
        }
    })
        .then(res => {
            console.log(`status code: ${res.status}`);
            console.log('Successfully deleted application (/) command.');
        })
        .catch(err => {
            console.error(err);
        });

}

const fetchAllCommands = async () => {
    fetch(`https://discord.com/api/v8/applications/${CONSTANTS.DISCORD_APP_ID}/guilds/${CONSTANTS.GUILD_ID}/commands`, {
        headers: {
            'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
        }
    })
        .then(res => res.json())
        .then(res => console.log(res))
        .catch(err => {
            console.error(err);
        });

}

const fetchCommandIds = async () => {
    try {
        const response = await fetch(`https://discord.com/api/v8/applications/${CONSTANTS.DISCORD_APP_ID}/commands`, {
            method: 'GET',
            headers: {
                'Authorization': `Bot ${CONSTANTS.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch commands');
        }

        const commandData = await response.json();
        // const commandIds = commandData.map(cmd => cmd.id);

        return commandData;

    } catch (error) {
        console.error('Error fetching command IDs:', error);
        return [];
    }
}

// fetchCommandIds().then(res => console.log(res))

// deleteCommand('1119685525670998119')

// (async () => {
//     setCommands(commands)
// })();

