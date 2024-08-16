const message = require("./message");

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    });


const contacts = [
    "alb21005@alumchat.lol",
    "alb210041@alumchat.lol",
    "her21000@alumchat.lol",
]

function showMenu() {
  console.log("-------Menu-------");
  console.log("1. Flooding Algorithm");
  console.log("2. Link State Algorithm");
  console.log("3. Exit");
  rl.question("Choose an option: ", handleMenuOption);
}

const flooding = (message, to) => {
    if (contacts.includes(to)) {
        console.log(`Message: ${message} sent to ${to}`);
    } else {
        contacts.forEach((contact) => {
            console.log(`Message: ${message} sent to ${contact}`);
        });
    }

    
}

function handleMenuOption(option) {
  switch (option) {
    case "1":
      console.log("Flooding Algorithm!!!");
        rl.question("Enter the message: ", (message) => {
            rl.question("Enter the destination: ", (to) => {
                flooding(message, to);
            });
        } );
        break;
    case "2":
      console.log("Link State Algorithm!!!");
      break;
    case "Exit":
        console.log("Bye!");
        rl.close();
        break;
    default:
      console.log("Invalid option");
  }
}

showMenu();