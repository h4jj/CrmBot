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

        const routesCollection = database.collection('routeState')
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
        const routesCollection = database.collection('routeState')

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

    let chatWithAgent = {
        state: 'open',
        questions: [
            { SubTotal: "<b>🛒 What is your order subtotal (before tax and service fee)?</b>" },
        ],
        closedMessage: "<b>Service is currently ⛔️ closed ⛔️, please try again tomorrow</b>",
        unavailableMessage: "",
        ticketNumber: 0,
        photoUrl: "",
        photoCaption: ""
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
    const routesCollection = database.collection('routeState')


    // Existing code...
    const updateQuery = { _id: new mongodb.ObjectId('659da9f3f99cf17f5eca5be1') }; // replace with your criteria
    const newValues = {
        $set: {
            "agent": chatWithAgent,
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