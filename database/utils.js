const { MongoClient, ServerApiVersion } = require('mongodb');
const mongodb = require('mongodb')
const CONSTANTS = require("../constants");

const routeState = require("../routeState");
const globalState = require("../globalState");

const client = new MongoClient(CONSTANTS.MONGO_TICKETS_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const getFreshWorkerObject = () => {

    return {
        ticketsCompleted: 0,
        totalRevenue: 0,
        ticketsHandled: {

        }
    }
}

function isConnected() {
    return !!client && !!client.topology && client.topology.isConnected()
}


const establishTicketsDatabaseConnection = async () => {
    try {

        try {
            if (!isConnected(client)) {
                console.log("Connecting to MongoDB...");
                await client.connect();
                console.log("Connected to MongoDB.");
            } else {
                console.log("Already connected to MongoDB.");
            }
        }
        catch (err) {
            console.error(err)
        }

        const database = client.db(CONSTANTS.DB)

        const routesCollection = database.collection('routesAvailability')
        const globalStateCollection = database.collection('globalState')

        let routesObject = await routesCollection.find({}).toArray();
        let globalStateObject = await globalStateCollection.find({}).toArray()

        routesObject = routesObject[0]
        globalStateObject = globalStateObject[0]

        for (let key in routesObject) {
            if (key !== "_id") {
                routeState.setRoute(key, routesObject[key])
                console.log(`Successfully set ${key} route`)
            }
        }

        if (globalStateObject.state) {
            globalState.setGlobalState(globalStateObject.state)
        }
        else {
            console.log("Global state fetched was empty")
        }

    } catch (err) {
        console.error('Database error:', err);
    }
}


const saveRouteStatus = async (route) => {
    try {
        let routeStatus = routeState.getRoute(route)
        const database = client.db(CONSTANTS.DB)
        const routesCollection = database.collection('routesAvailability')

        const key = route;
        const newValue = routeStatus;

        try {
            const result = await routesCollection.updateOne(
                { [key]: { $exists: true } },
                { $set: { [key]: newValue } }
            );

            console.log("Successfully saved route status: ", result)
        }
        catch (err) {
            console.error(err)
        }


    } catch (err) {
        console.error('Database error:', err);
    }
}

const saveGlobalState = async () => {

    const database = client.db(CONSTANTS.DB)
    const globalStateCollection = database.collection('globalState')

    const key = 'state';
    const newValue = globalState.getGlobalState();

    try {
        const result = await globalStateCollection.updateOne(
            { [key]: { $exists: true } },
            { $set: { [key]: newValue } }
        );

        console.log(result);
    }
    catch (err) {
        console.error(err)
    }


}

const initializeRouteState = async () => {

    let smallDD = {
        state: 'open',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
            { Restaurant: "<b>🍔 Restaurant Name? </b>" },
            { Type: "<b>🚗 Pickup Or Delivery?</b>" },
            { Address: "<b>🏠 Home Address? include apt and buzzer if applicable (Restaurant address if order is pickup) </b>" },
            { Tip: "<b>💸 How much do you want to tip the driver? (Faster Delivery)</b>" }
        ],
        closedMessage: "<b>Doordash service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/a/k8cfTOw",
        photoCaption: "🚗Doordash 50% off\n\n✨Minimum $30 subtotal. No max!\n\n✨Minimum $40 Subtotal for Pickup\n\n✨Tip is paid 100%\n\n✨Restaurants only!"
    }

    let smallDDCanada = {
        state: 'open',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
            { Restaurant: "<b>🍔 Restaurant Name? </b>" },
            { Type: "<b>🚗 Pickup Or Delivery?</b>" },
            { Address: "<b>🏠 Home Address? include apt and buzzer if applicable (Restaurant address if order is pickup) </b>" },
            { Tip: "<b>💸 How much do you want to tip the driver? (Faster Delivery)</b>" }
        ],
        closedMessage: "<b>Doordash service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/a/k8cfTOw",
        photoCaption: "🚗Doordash 50% off\n\n✨Minimum $35 subtotal. No max!\n\n✨Minimum $45 Subtotal for Pickup\n\n✨Tip is paid 100%\n\n✨Restaurants only!"
    }

    let bigDD = {
        state: 'open',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
            { Restaurant: "<b>🍔 Restaurant Name? </b>" },
            { Address: "<b>🏠 Home Address? include apt and buzzer if applicable </b>" },
            { Tip: "<b>💸 How much do you want to tip the driver? (Faster Delivery)</b>" }
        ],
        closedMessage: "<b>Doordash service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/a/k8cfTOw",
        photoCaption: "🚗 Big Doordash $80+ Subtotal 60% OFF 🚗\n\n✨Restaurants Only!\n\n📲 Have DoorDash App installed on your phone so you're able to track your order!"
    }

    let bigDDCanada = {
        state: 'open',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
            { Restaurant: "<b>🍔 Restaurant Name? </b>" },
            { Address: "<b>🏠 Home Address? include apt and buzzer if applicable </b>" },
            { Tip: "<b>💸 How much do you want to tip the driver? (Faster Delivery)</b>" }
        ],
        closedMessage: "<b>Doordash service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/a/k8cfTOw",
        photoCaption: "🚗 Big Doordash $90+ Subtotal 60% OFF 🚗\n\n✨Restaurants Only!\n\n📲 Have DoorDash App installed on your phone so you're able to track your order!"
    }


    let storeObj = {
        state: 'open',
        questions: [
            {
                Info: "<b>Would you like to open a ticket for a consultation?</b>\n\nIf yes please ask what your question is.\n\nIf no please use /close "
            }
        ],
        closedMessage: "<b>Store Refund service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "<b>Store Refund service is currently being worked on and will be available soon!</b>",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/xCPj3i5",
        photoCaption: "<b>Discover the ultimate refunding service that puts 100% of the money back into your pocket without the hassle of returning orders!</b> 💸💰\n\n🔥 How It Works:\n\n1️⃣ Shop as usual and make your purchase.\n\n2️⃣ Share your order details\n\n3️⃣ We process your refund"
    }

    let instacartObj = {
        state: 'closed',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
            { Restaurant: "<b>🥙 Grocery Store Name? </b>" },
            { Address: "<b>🏠 Home Address? include apt and buzzer if applicable </b>" },
            { Tip: "<b>💸 How much do you want to tip the driver? (Faster Delivery)</b>" }
        ],
        closedMessage: "<b>Instacart service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "<b>Instacart service is temporarily unavailable</b>",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/iIn1Omo",
        photoCaption: "<b>🚨 40% Off Grocery Stores (60$ minimum subtotal)</b>\n\n<b>🤑 Tip is paid 100%</b>\n\n<b>🥗 Groceries only</b>\n\n"
    }

    let grubhubObj = {
        state: 'closed',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
            { Restaurant: "<b>🍔 Restaurant Name? </b>" },
            { Type: "<b>🚗 Pickup Or Delivery?</b>" },
            { Address: "<b>🏠 Home Address? include apt and buzzer if applicable (Restaurant address if order is pickup) </b>" },
            { Tip: "<b>💸 How much do you want to tip the driver? (Faster Delivery)</b>" }
        ],
        closedMessage: "<b>Grubhub service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "<b>Grubhub service is temporarily unavailable</b>",
        ticketNumber: 0,
        photoUrl: "https://imgur.com/Qb5SBj4",
        photoCaption: "<b>🚨 50% Off Restaurants (30$ minimum subtotal)</b>\n\n<b>🤑 Tip is paid 100%</b>\n\n<b>🍔 Restaurants only</b>\n\n"
    }

    try {
        if (!isConnected(client)) {
            console.log("Connecting to MongoDB...");
            await client.connect();
            console.log("Connected to MongoDB.");
        } else {
            console.log("Already connected to MongoDB.");
        }
    }
    catch (err) {
        console.error(err)
    }

    const database = client.db(CONSTANTS.DB)
    const routesCollection = database.collection('routesAvailability')


    // Existing code...
    const updateQuery = { _id: new mongodb.ObjectId('64a17cf7f302d6fd2bf1dafc') }; // replace with your criteria
    const newValues = {
        $set: {
            "small-dd": smallDD,
            "small-dd-can": smallDDCanada,
            "big-dd": bigDD,
            "big-dd-can": bigDDCanada,
            store: storeObj,
            instacart: instacartObj,
            grubhub: grubhubObj
        }
    };

    try {
        const result = await routesCollection.updateOne(updateQuery, newValues);
        console.log('Matched documents:', result.matchedCount);
        console.log('Modified documents:', result.modifiedCount);
        await client.close()
    } catch (err) {
        console.error('An error occurred:', err);
    }


}



const createDailyRevenueCollection = async () => {

    const months = ["jan", "feb", "mar", "apr", "may", "june", "july", "aug", "sep", "oct", "nov", "dec"];

    const d = new Date()
    const month = months[d.getMonth()]
    const year = d.getFullYear()

    try {
        if (!isConnected(client)) {
            console.log("Connecting to MongoDB...");
            await client.connect();
            console.log("Connected to MongoDB.");
        } else {
            console.log("Already connected to MongoDB.");
        }
    }
    catch (err) {
        console.error(err)
    }


    const revenueDatabase = client.db(`revenue${year}`)

    const collections = (await revenueDatabase.listCollections().toArray()).map(collection => collection.name);

    if (collections.includes(month)) {
        console.log("Collection found, no need to create one")
        return
    }

    const collection = await revenueDatabase.createCollection(month);

    console.log(`Collection created: ${collection.collectionName}`);

}

const addRevenueToDatabase = async (channelId, amount, displayName) => {

    const months = ["jan", "feb", "mar", "apr", "may", "june", "july", "aug", "sep", "oct", "nov", "dec"];



    const d = new Date()
    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()


    const revenueDatabase = client.db(`revenue${year}`)

    const collection = revenueDatabase.collection(month)

    const propertyKey = `${month}${day}`

    const doc = await collection.findOne({ [propertyKey]: { $exists: true } });

    if (!doc) {
        const newDoc = {
            [propertyKey]: {} // Add your default value here
        };
        await collection.insertOne(newDoc);
        console.log(`Added new document with property key: ${propertyKey}`);
    } 

    const revenueObject = await collection.findOne({ [propertyKey]: { $exists: true } }).then(res => res).catch(err => console.log(err))

    let dayObject = revenueObject[propertyKey]

    if (!dayObject[displayName]) {
        dayObject[displayName] = getFreshWorkerObject()
    }


    if (dayObject[displayName].ticketsHandled[channelId]) {

        dayObject[displayName].totalRevenue -= dayObject[displayName].ticketsHandled[channelId].amountPaid
        dayObject[displayName].ticketsHandled[channelId].amountPaid = Number(amount)

    }
    else {
        dayObject[displayName].ticketsHandled[channelId] = {
            amountPaid: Number(amount)
        }

    }

    dayObject[displayName].totalRevenue += Number(amount)
    dayObject[displayName].ticketsCompleted += 1

    // If the document exists, update it
    await collection.updateOne({ [propertyKey]: { $exists: true } }, { $set: { [propertyKey]: dayObject } });
    console.log(`Updated existing document with property key: ${propertyKey}, new value: ${JSON.stringify(dayObject)}`);

}


// initializeRouteState()

module.exports = { establishTicketsDatabaseConnection, saveRouteStatus, saveGlobalState, addRevenueToDatabase }