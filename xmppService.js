const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

connect();