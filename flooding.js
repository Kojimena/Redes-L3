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


debug(xmpp, true);

xmpp.on("error", (err) => {
  console.error(err);
});

xmpp.on("offline", () => {
  console.log("offline");
});

xmpp.on("stanza", async (stanza) => {
  if (stanza.is("message")) {
    await xmpp.send(xml("presence", { type: "unavailable" }));
    await xmpp.stop();
  }
});

xmpp.on("online", async () => {
  await xmpp.send(xml("presence"));

});

async function connect() {
    await xmpp.start();
}

// TODO Cuando entra un mensaje, si el destino no somos nosotros, lo reenviamos a todos los contactos

const flooding = (to, message) => {

    if (contacts.includes(to)) {
        console.log(`Message: ${message} sent to ${to}`);
    } else {
        contacts.forEach((contact) => {
            console.log(`Message: ${message} sent to ${contact}`);
        });
    }
    
}

function execute() {
    connect();
     rl.question("Enter the message: ", (msg) => {
        rl.question("Enter the destination: ", (to) => {
            const message = message("message", to, 0, [], msg);
            flooding(message, to);
        });
    } ); 
}

execute();
