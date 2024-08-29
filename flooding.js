const { getContactsForUser } = require('./loadConfig');

const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");
const message = require("./message");
const readline = require("readline");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});


if (process.argv.length !== 5) {
  console.log("Usage: node linkState.js <group> <username> <password>");
  process.exit(1);
}

const group = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];
const contacts = [];

const xmpp = client({
  service: "ws://alumchat.lol:7070/ws",
  domain: 'alumchat.lol',
  resource: 'web',
  username: username.split('@')[0],
  password: password,
});

const getContacts = async () => {
  const c = await getContactsForUser(group);
  console.log("c: ", c);
  contacts.push(...c);
}


debug(xmpp, false);  // Falso para no mostrar los mensajes de debug

xmpp.on("error", (err) => {
  console.error(err);
});

xmpp.on("offline", () => {
  console.log("offline");
  xmpp.stop();
});

xmpp.on("online", async () => {
  console.log("---online");
  getContacts();
  await xmpp.send(xml("presence"));
  rl.question("Enter the message: ", (msg) => {
    rl.question("Enter the destination: ", (to) => {
        const body = new message("message", username, to, 0, [], msg);
        console.log("Created message: ", body.toString());
        flooding(to, body.toString());
    });
  });
});

/**
 * Función para conectarse al servidor
 * @returns {any}
 */
async function connect() {
    await xmpp.start();
}

/**
 * Recibe un mensaje y si no es para nosotros, lo reenvía a todos los contactos
 * @param {any} "stanza"
 * @param {any} 
 * @returns {any}
 */
xmpp.on("stanza", async (stanza) => {
  if (stanza.is('message') && stanza.getChild('body')) {
    const from = stanza.attrs.from;
    const body = stanza.getChildText('body');
    
    console.log(`Received message from ${from}: ${body}`);
    msg = parseMessage(body);

    console.log("Username: ", xmpp.jid.local);

    if (msg.to !== username) {
        if (contacts.includes(msg.to)) {
            console.log(`Message: ${body} sent to ${msg.to}`);
            sendMessage(msg.to, body);
        } else {
            flooding(msg.to, body);
        }
    }
  }
});

/**
 * Algoritmo de flooding/ recibe un mensaje y si tenemos un destino, lo envía, si no, lo envía a todos los contactos
 * @param {any} to
 * @param {any} body
 * @returns {any}
 */
const flooding = (to, body) => {
  if (contacts.includes(to)) {
      console.log(`Message: ${body} sent to ${to}`);
      sendMessage(to, body);
  } else {
      contacts.forEach((contact) => {
          console.log(`Message: ${body} sent to ${contact}`);
          sendMessage(contact, body);
      });
  }
  
}

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
 * Envia un mensaje a un destinatario
 * @param {any} to
 * @param {any} body
 * @returns {any}
 */
async function sendMessage(to, body) {
  try {
    const stanza = xml('message', { to, type: 'chat' }, xml('body', {}, body));
    await xmpp.send(stanza);
    console.log('Message sent✅');
  } catch (err) {
    console.error('❌ Message error:', err.toString());
  }
}


// TODO Cuando entra un mensaje, si el destino no somos nosotros, lo reenviamos a todos los contactos

/**
 * Función principal
 * @returns {any}
 */
function execute() {
    connect();
}

execute();
