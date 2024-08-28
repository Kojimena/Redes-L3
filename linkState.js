const { getContactsForUser } = require('./loadConfig');
const { client, xml } = require("@xmpp/client");
const message = require("./message");
const readline = require("readline");
const debug = require("@xmpp/debug");



process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const group = 'B';  // Grupo actual
const username = 'grupo6@alumchat.lol';  // Usuario actual
const password = '1234';  // Contraseña del usuario actual

const contacts = [];
const topology = {};

const xmpp = client({
    service: "ws://alumchat.lol:7070/ws",
    domain: 'alumchat.lol',
    resource: 'web',
    username: 'grupo6',
    password: '1234',
  });

debug(xmpp);

const getContacts = async () => {
    const c = await getContactsForUser(group);
    console.log("c: ", c);
    contacts.push(...c);
}


async function connect() {
    await xmpp.start();
}


xmpp.on("online", async () => {
    console.log("---online");
    await xmpp.send(xml("presence"));
    await getContacts();
    requestTopology();
});

/**
 * Parsea un mensaje al formato JSON
 * @param {any} msj
 * @returns {any}
 */
const parseMessage = (msj) => {
    const message = JSON.parse(msj);
    return message;
}


/**
 * Recibe un mensaje y si no es para nosotros, lo reenvía a todos los contactos
 * @param {any} "stanza"
 * @param {any} 
 * @returns {any}
 */
xmpp.on("stanza", async (stanza) => {
    if (stanza.is('message') && stanza.getChild('body')) {
        const body = stanza.getChildText('body');
        const msg =  parseMessage(body);
        if (msg.type === 'echo') {
            console.log("Received echo message: ", msg.toString());
            
            // MANDAMOS LA TOPOLOGÍA DE UN NODO
            const body = new message("info", username, msg.from, 0, [{"request": "topology"}], contacts);
            console.log("Created message: ", body.toString());
            
            // {"type":"info","from":"grupo6@alumchat.lol","to":"alb210041@alumchat.lol","hops":0,"headers":[{"request":"topology"}],"payload":["her21199@alumchat.lol","alb21005@alumchat.lol","alb210041@alumchat.lol"]}
            xmpp.send(xml("message", { to: msg.from, from: username }, xml("body", {}, body.toString())));
            
        } else if (msg.type === 'info') {
            // RECIBIMOS LA TOPOLOGÍA DE UN NODO
            // Parseamos la topología
            const t = msg.payload;
            topology[msg.from] = t;
        }

        console.log("Current topology: ", topology);
    }
});


const requestTopology = () => {
    console.log("Requesting topology...");
    contacts.forEach((contact) => {
        const body = new message("echo", username, contact, 0, [{"request": "topology"}], "Hello, I need the topology");
        console.log("Created message: ", body.toString());
        xmpp.send(xml("message", { to: contact, from: username }, xml("body", {}, body.toString())));
    })
}


function execute() {
    connect();
}

execute();
