const { getContactsForUser } = require('./loadConfig');
const { client, xml } = require("@xmpp/client");
const message = require("./message");
const readline = require("readline");
const debug = require("@xmpp/debug");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// leer grupo, usuario y contraseña de los argumentos de la línea de comandos
if (process.argv.length !== 5) {
    console.log("Usage: node linkState.js <group> <username> <password>");
    process.exit(1);
}

const group = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];

const contacts = [];
const topology = {};

const xmpp = client({
    service: "ws://alumchat.lol:7070/ws",
    domain: 'alumchat.lol',
    resource: 'web',
    username: username.split('@')[0],
    password: password,
  });

debug(xmpp);

const getContacts = async () => {
    const c = await getContactsForUser(group);
    console.log("c: ", c);
    contacts.push(...c);
}


/**
 * Función para conectarse al servidor XMPP
 * @returns {any}
 */
async function connect() {
    await xmpp.start();
}

/**
 * Función para enviar un mensaje
 * @returns {any}
 */
const sendMessage = () => {
    rl.question("Enter the message: ", (msg) => {
        rl.question("Enter the destination: ", (to) => {
            const body = new message("message", username, to, 0, [], msg);
            console.log("Created message: ", body.toString());

            linkStateAlgorithm(body);
        });
    });
}

xmpp.on("online", async () => {
    console.log("---online");
    await xmpp.send(xml("presence"));
    await getContacts();
    requestTopology();

    sendMessage();
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
            console.log("📩Received echo message: ", msg.toString());
            
            // MANDAMOS LA TOPOLOGÍA DE UN NODO
            const body = new message("info", username, msg.from, 0, [{"request": "topology"}], contacts);
            console.log("Created message: ", body.toString());
            
            // {"type":"info","from":"grupo6@alumchat.lol","to":"alb210041@alumchat.lol","hops":0,"headers":[{"request":"topology"}],"payload":["her21199@alumchat.lol","alb21005@alumchat.lol","alb210041@alumchat.lol"]}
            xmpp.send(xml("message", { to: msg.from, from: username }, xml("body", {}, body.toString())));

            // if the sender is not in the topology, request its topology
            const topologykeys = Object.keys(topology);
            console.log("Topology keys: ", topologykeys);
            if (!topologykeys.includes(msg.from) && msg.from !== username) {
                console.log("Requesting topology from: ", msg.from);

                const body = new message("echo", username, msg.from, 0, [{"request": "topology"}], "Hello, I need the topology");
                xmpp.send(xml("message", { to: msg.from, from: username }, xml("body", {}, body.toString())));
            }
            
        } else if (msg.type === 'info') {
            // Parseamos la topología
            const t = msg.payload;
            topology[msg.from] = t;

            // Por cada contacto, si no está en la topología, solicitamos la topología
            const topologykeys = Object.keys(topology);
            console.log("Topology keys: ", topologykeys);
            if (!topologykeys.includes(msg.from) && msg.from !== username) {
                console.log("Requesting topology from: ", msg.from);

                const body = new message("echo", username, msg.from, 0, [{"request": "topology"}], "Hello, I need the topology");
                xmpp.send(xml("message", { to: msg.from, from: username }, xml("body", {}, body.toString())));
            }

        } else if (msg.type === 'message') {

            if (msg.to === username) {
                console.log("Received message: ", msg);
                return;
            }

            const t = msg.payload;
            const hops = msg.hops + 1;  // Nuestro turno

            const next = msg.headers[hops+1];  // Siguiente nodo al que nosotros debemos enviar el mensaje

            const body = new message("message", msg.from, msg.to, hops, msg.headers, t);   
            console.log("Created message: ", body.toString()); 
            
            xmpp.send(xml("message", { to: next, from: username }, xml("body", {}, body.toString())));
            
        }

        console.log("Current topology: ", topology);
    }
});


/**
 * Solicita la topología a todos los contactos
 * @returns {any}
 */
const requestTopology = () => {
    console.log("Requesting topology...");
    contacts.forEach((contact) => {
        const body = new message("echo", username, contact, 0, [{"request": "topology"}], "Hello, I need the topology");
        console.log("Created message: ", body.toString());
        xmpp.send(xml("message", { to: contact, from: username }, xml("body", {}, body.toString())));
    })
}

/**
 * Algoritmo de Dijkstra para encontrar la ruta más corta
 * @param {any} graph
 * @param {any} start
 * @returns {any}
 */
const dijkstra = (graph, start) => {
    let distances = {};
    let visited = new Set();
    let predecessors = {};
    let nodes = Object.keys(graph);

    for (let node of nodes) {
        distances[node] = Infinity;
        predecessors[node] = null;
    }

    distances[start] = 0;

    while (nodes.length) {
        nodes.sort((a, b) => distances[a] - distances[b]);
        let closestNode = nodes.shift();

        if (distances[closestNode] === Infinity) break;

        visited.add(closestNode);

        for (let neighbor in graph[closestNode]) {
            if (!visited.has(neighbor)) {
                let newDistance = distances[closestNode] + graph[closestNode][neighbor];

                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    predecessors[neighbor] = closestNode;
                }
            }
        }
    }

    return { distances, predecessors };
}

/**
 * Algoritmo de Link State
 * @param {any} msg
 * @returns {any}
 */
const linkStateAlgorithm = (msg) => {
    console.log("Link State Algorithm!!!");

    // Asumir un peso de 1 para cada enlace
    const weights = {};
    const nodes = Object.keys(topology);

    // Construir la tabla de pesos para cada conexión directa
    nodes.forEach(n => {
        weights[n] = {};
        topology[n].forEach(neighbor => {
            weights[n][neighbor] = 1;  // Establece el peso de cada conexión
        });
    });

    // Ingresar los nodos de la cuenta actual
    weights[username] = {};
    contacts.forEach(contact => {
        weights[username][contact] = 1;
    });

    console.log("Weights: ", weights);

    // Aplica Dijkstra para encontrar las rutas más cortas desde el nodo actual
    const { distances, predecessors } = dijkstra(weights, username);

    console.log("Distances: ", distances);
    console.log("Predecessors: ", predecessors);

    // Construir el path hacia el destino
    let path = [];
    let current = msg.to;
    while (current) {
        path.unshift(current);
        current = predecessors[current];
    }

    console.log("Path: ", path);

    msg.hops = 0;
    msg.headers = path;

    if (path.length === 1) {
        console.log("Message sent to: ", path[0]);
        return;
    }

    xmpp.send(xml("message", { to: path[1], from: msg.from }, xml("body", {}, msg.toString())));
    console.log("Message sent to: ", path[1]);

    sendMessage();

};


/**
 * Función principal para ejecutar el programa
 * @returns {any}
 */
function execute() {
    connect();
}

execute();