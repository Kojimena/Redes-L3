const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");
const message = require("./message");
const readline = require("readline");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const contacts = [
    "alb21005@alumchat.lol",
    "alb210041@alumchat.lol",
    "her21000@alumchat.lol",
]

const xmpp = client({
  service: "ws://alumchat.lol:7070/ws",
  domain: 'alumchat.lol',
  resource: 'web',
  username: "her21004",
  password: "nutella56",
});


debug(xmpp, false);  // Falso para no mostrar los mensajes de debug

xmpp.on("error", (err) => {
  console.error(err);
});

xmpp.on("offline", () => {
  console.log("offline");
  xmpp.stop();
});

xmpp.on("stanza", async (stanza) => {
  if (stanza.is("message")) {
    await xmpp.send(xml("presence", { type: "unavailable" }));
    await xmpp.stop();
  }
});

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

xmpp.on("online", async () => {
  console.log("---online");
  await xmpp.send(xml("presence"));
  rl.question("Enter the message: ", (msg) => {
    rl.question("Enter the destination: ", (to) => {
        const body = new message("message", "her21004@alumchat.lol", to, 0, [], msg);
        console.log("Created message: ", body.toString());
        flooding(to, body.toString());
    });
  });
});

async function connect() {
    await xmpp.start();
}

async function sendMessage(to, body) {
  try {
    const stanza = xml('message', { to, type: 'chat' }, xml('body', {}, body));
    await xmpp.send(stanza);
    console.log('Message sent');
  } catch (err) {
    console.error('❌ Message error:', err.toString());
  }
}


// TODO Cuando entra un mensaje, si el destino no somos nosotros, lo reenviamos a todos los contactos

function execute() {
    connect();
}

execute();
