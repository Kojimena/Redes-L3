const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    });
function showMenu() {
  console.log("-------Menu-------");
  console.log("1. Flooding Algorithm");
  console.log("2. Link State Algorithm");
  console.log("3. Exit");
  rl.question("Choose an option: ", handleMenuOption);
}

function handleMenuOption(option) {
  switch (option) {
    case "1":
      console.log("Flooding Algorithm!!!");
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
    showMenu();
}

showMenu();