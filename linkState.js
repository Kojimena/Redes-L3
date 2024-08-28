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

    rl.question("Enter the message: ", (msg) => {
        rl.question("Enter the destination: ", (to) => {
            const body = new message("message", username, to, 0, [], msg);
            console.log("Created message: ", body.toString());

            linkStateAlgorithm(body);
        });
      });
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

const dijkstra = (graph, start) => {
    // Create an object to store the shortest distance from the start node to every other node
    let distances = {};

    // A set to keep track of all visited nodes
    let visited = new Set();

    // Get all the nodes of the graph
    let nodes = Object.keys(graph);
    console.log("Nodes: ", nodes);

    // Initially, set the shortest distance to every node as Infinity
    for (let node of nodes) {
        distances[node] = Infinity;
    }
    
    // The distance from the start node to itself is 0
    distances[start] = 0;

    // Loop until all nodes are visited
    while (nodes.length) {
        // Sort nodes by distance and pick the closest unvisited node
        nodes.sort((a, b) => distances[a] - distances[b]);
        let closestNode = nodes.shift();

        // If the shortest distance to the closest node is still Infinity, then remaining nodes are unreachable and we can break
        if (distances[closestNode] === Infinity) break;

        // Mark the chosen node as visited
        console.log("Closest node: ", closestNode);
        visited.add(closestNode);

        // For each neighboring node of the current node
        for (let neighbor in graph[closestNode]) {
            // If the neighbor hasn't been visited yet
            if (!visited.has(neighbor)) {
                // Calculate tentative distance to the neighboring node
                let newDistance = distances[closestNode] + graph[closestNode][neighbor];
                
                // If the newly calculated distance is shorter than the previously known distance to this neighbor
                if (newDistance < distances[neighbor]) {
                    // Update the shortest distance to this neighbor
                    distances[neighbor] = newDistance;
                }
            }
        }
    }

    // Return the shortest distance from the start node to all nodes
    return distances;
}

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
    const distances = dijkstra(weights, username);

    console.log("Distances: ", distances);

};





function execute() {
    connect();
}

execute();

// {"type":"info","from":"alb210041@alumchat.lol","to":"grupo6@alumchat.lol","hops":0,"headers":[{"request":"topology"}],"payload":["alb111@alumchat.lol"]}

// {"type":"info","from":"her21199@alumchat.lol","to":"grupo6@alumchat.lol","hops":0,"headers":[{"request":"topology"}],"payload":["alb210041@alumchat.lol"]}
// {"type":"info","from":"alb210041@alumchat.lol","to":"grupo6@alumchat.lol","hops":0,"headers":[{"request":"topology"}],"payload":["ram21600@alumchat.lol"]}
//  {"type":"info","from":"ram21600@alumchat.lol","to":"grupo6@alumchat.lol","hops":0,"headers":[{"request":"topology"}],"payload":["her21000@alumchat.lol"]}