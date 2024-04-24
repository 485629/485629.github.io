// main.js
import { initializeApp } from 'https://cdn.skypack.dev/firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'https://cdn.skypack.dev/firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAXqxpbQ8CUjsLfg2JDA79lbLmrC0-X1bs",
    authDomain: "kulicka-72cdf.firebaseapp.com",
    projectId: "kulicka-72cdf",
    storageBucket: "kulicka-72cdf.appspot.com",
    messagingSenderId: "50336358074",
    appId: "1:50336358074:web:c19adcc735a2c5125b2c83",
    measurementId: "G-3HJW1LCBM2"
};
const app = initializeApp(firebaseConfig);

// const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function postResponseTime() {
    endTime = Date.now();
    responseTime = endTime - startTime;
    await addDoc(collection(db, "responseTimeNew"), {
      map: currentMap,
      date: new Date(Date.now()).toLocaleString('en-GB', { timeZone: 'UTC' }),
      responseTime: responseTime,
      numberOfMoves: numOfMoves,
      gameFinished: !isGameRunning
    });
  }

// async function fetchResponseTimes() {
//     const collectionRef = collection(db, 'responseTimeNew');
//     const snapshot = await getDocs(collectionRef);
//     const responseTimes = snapshot.docs.map(doc => doc.data().responseTime);
//     return responseTimes;
// }

// fetchResponseTimes().then(responseTimes => {
//     console.log(responseTimes); // Prints an array of response times
// });
document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get the selected rating or default to "0" if none selected
    const rating = document.querySelector('input[name="rating"]:checked') ? document.querySelector('input[name="rating"]:checked').value : "0";
    const feedback = document.getElementById('feedback').value.trim();

    // Validation to prevent both empty feedback and zero rating
    if (rating === "0" && feedback === "") {
        alert("Please provide a rating or feedback before submitting.");
        return;
    }

    console.log('Submitting with rating: ' + rating + ' and feedback: ' + feedback);
    await addDoc(collection(db, "feedbackNew"), {
        map: currentMap,
        date: new Date(Date.now()).toLocaleString('en-GB', { timeZone: 'UTC' }),
        rating: rating,
        feedback: feedback,
        responseTime: responseTime,
        numberOfMoves: numOfMoves,
        gameFinished: !isGameRunning
    })
    .then(() => {
        console.log('Feedback submitted successfully');
        alert('Thank you for your feedback!');
        document.getElementById('feedbackForm').reset();
        document.getElementById('feedbackForm').style.display = 'none';
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback.');
    });
});


// Global variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mapPools = [
    {
        path : 'Tutorial',
        size : 5
    },
    {
        path : 'Two Players As One',
        size : 10
    },
    {
        path : 'Teleports',
        size : 10
    }, 
    {
        path : 'Switches And Gates',
        size : 10
    }
]

function generateMapPaths(mapPoolIndex) {
    var map = mapPools[mapPoolIndex];
    const mapPaths = [];
    for (let i = 1; i <= map.size; i++) {
        mapPaths.push(`${map.path}/map${i}.json`);
    }
    return mapPaths;
}
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

var maps = generateMapPaths(0);
const mapSelector = document.getElementById('mapSelector');
const folderSelector = document.getElementById('folderSelector');

function map_options_selector(){
    while (mapSelector.options.length > 0) { 
        mapSelector.remove(0); 
    }

    maps.forEach((map, index) => {
        const option = document.createElement('option');
        option.value = map;
        option.textContent = 'Map ' + (index + 1);
        mapSelector.appendChild(option);
    });
}

map_options_selector();

mapPools.forEach((folder, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = folder.path;
    folderSelector.appendChild(option);
});

mapSelector.addEventListener('change', (event) => {
    const selectedMap = event.target.value;
    currentMap = selectedMap;
    document.getElementById('winMessage').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'block';
    gameStart(selectedMap);
});

folderSelector.addEventListener('change', (event) => {
    maps = generateMapPaths(event.target.value);
    map_options_selector();
    currentMap = maps[0]
    gameStart(maps[0]);
});

document.addEventListener('DOMContentLoaded', () => {
    currentMap = maps[0];
    document.getElementById('winMessage').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'block';
    gameStart(maps[0]);
});

ctx.strokeStyle = 'black'; // Set the color of the stroke
ctx.lineWidth = 2; // Set the width of the stroke
document.addEventListener('keydown', async function(event) {
    // Check if the event target is a form element
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        // If the event is from an input or textarea, ignore it
        return;
    }

    switch (event.key) {
        case 'ArrowUp': await handleKeyPressFunction("up"); break;
        case 'ArrowDown': await handleKeyPressFunction("down"); break;
        case 'ArrowLeft': await handleKeyPressFunction("left"); break;
        case 'ArrowRight': await handleKeyPressFunction("right"); break;
        case 'r': restart(); return;
    }

    await sleep(300);
    await handleGameCompletion();
});

let currentMap;
let oneCellHeight;
let numOfMoves = 0;
let height;
let players = [];
let foods = [];
let grid;
let isGameRunning = true;
let startTime = Date.now();
let endTime = Date.now();
let firstMoveDone = false;
let responseTime = 0;


const directionDic = {"down": [0,1], "up": [0,-1], "left": [-1,0], "right": [1,0]}

function gameStart(map){
    fetch(map)
    .then(response => response.json())
    .then(data => {
        initializeGame(data);
    })
    .catch(error => {
        console.error('Error loading maze:', error);
    });
}


async function handleGameCompletion() {
    if(foods.length == 0 && isGameRunning){
        run();
        isGameRunning = false;
        await postResponseTime();
        requestAnimationFrame(run);
        document.getElementById('winMessage').style.display = 'block';
        document.getElementById('gameControls').style.display = 'none';
        document.getElementById('feedbackForm').style.display = 'block';
        document.getElementById('welcomeMessage').style.display = 'none';
    }
}


async function restart(){
    if(isGameRunning && numOfMoves != 0){
        await postResponseTime();
    }
    firstMoveDone = false;
    isGameRunning = true;
    document.getElementById('winMessage').style.display = 'none';
    document.getElementById('gameControls').style.display = 'block';
    document.getElementById('feedbackForm').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'block';
    numOfMoves = 0;
    gameStart(currentMap); // You'll need to define how to reinitialize your game
}

window.restartGame = async function() {
    await restart();
};
window.showForm = function(disp) {
    document.getElementById('feedbackForm').style.display = disp;
};

window.move = async function(orientation){
    await handleKeyPressFunction(orientation);
    await handleGameCompletion();
};

window.changeMap = async function(direction){
    let ind = maps.indexOf(currentMap);
    switch (direction) {
        case "next":
            if(ind != maps.length - 1){
                ind += 1;
            }
            currentMap = maps[ind];
            mapSelector.options.selectedIndex = ind;
            await restart();
            break;
        case "previous":
            if(ind != 0){
                ind -= 1;
            }
            currentMap = maps[ind];
            mapSelector.options.selectedIndex = ind;
            await restart();
            break;
        default:
            break;
    }
}


function initAttributes(size){
    isGameRunning = true;
    height = canvas.height;
    oneCellHeight = height / size;
    foods = [];
    grid = null;
    players = [];
}


function createGrid(size) {
    let grid = [];
    for (let y = 0; y < size; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            row.push(new Cell(x, y, height / size));
        }
        grid.push(row);
    }
    return grid;
}


function initializeGame(data) {
    // Create the grid based on gridSize
    initAttributes(data.gridSize);
    height = canvas.height;
    oneCellHeight = height / data.gridSize;
    grid = createGrid(data.gridSize);
    

    // Place the player
    if(data.players != null){
        data.players.forEach(element => {
            players.push(new Player(element.x, element.y, oneCellHeight / 6, element.color));
        });
    };

    if(data.teleports != null){
        let from = {
            x: data.teleports[0].x,
            y: data.teleports[0].y
        };
        let to = {
            x: data.teleports[1].x,
            y: data.teleports[1].y
        };
        grid[data.teleports[0].y][data.teleports[0].x].addTeleport(to);
        grid[data.teleports[1].y][data.teleports[1].x].addTeleport(from);
    }

    data.cells.forEach(cell => {
        if (cell.food) {
            foods.push(new Food(cell.x, cell.y, oneCellHeight/12));
        }

        // Add walls to the grid
        grid[cell.y][cell.x].addWalls(cell.walls);
    });

    // Place food, gates, and switches
    if (data.gate) {
        let mySwitch = new Switch(data.gate.switch.x, data.gate.switch.y, oneCellHeight);
        grid[mySwitch.y][mySwitch.x].addSwitch(mySwitch);
        data.gate.cells.forEach(cell =>{
            let gate = new Gate(cell.x, cell.y, oneCellHeight, cell.orientation, mySwitch);
            grid[cell.y][cell.x].addGate(gate);
        })
    }

    // Start the game loop
    requestAnimationFrame(run);
}

async function run() {
    if (!isGameRunning) return;

    drawElements();

    requestAnimationFrame(run);
}

function drawElements(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    grid.forEach(row => row.forEach(cell => cell.draw()));

    // Draw player, food, gates, and switches
    players.forEach(player => player.draw());
    foods.forEach(food => food.draw());
}





function checkForFood(cell){
    for (let i = 0; i < foods.length; i++) {
        if (cell.x === foods[i].x && cell.y === foods[i].y) {
            foods.splice(i, 1);
        }
    }
}

function toggleSwitch(cell){
    if(cell.switch){
        cell.switch.toggleSwitch();
    }   
}

function isAnotherPlayerOnCell(x, y, player){
    if (players.length > 1){
        let filteredPlayers = players.filter(pl => pl !== player);
        return filteredPlayers.some(player => player.x === x && player.y === y);
    }
    return false;
}

function sortedPlayers(orientation){
    switch (orientation) {
        case "right":
            return players.sort((a,b) => b.x - a.x);
        case "left":
            return players.sort((a,b) => a.x - b.x);
        case "down":
            return players.sort((a,b) => b.y - a.y);
        case "up":
            return players.sort((a,b) => a.y - b.y);
    }
    return players;
}


async function handleKeyPressFunction(orientation){
    if(isGameRunning){
        numOfMoves += 1;
    }
    if (firstMoveDone == false){
        firstMoveDone = true;
        startTime = Date.now();
    }
    let players = sortedPlayers(orientation);
    await sleep(100);
    players.forEach(async player => {
        let teleported = false;
        while(true){
            let newPosition = grid[player.y][player.x].move(player, orientation, teleported)
            if(newPosition){
                if(newPosition.teleported){
                    await sleep(100);
                }
                player.x = newPosition.cell.x;
                player.y = newPosition.cell.y;
                teleported = newPosition.teleported;
                if(newPosition.teleported){
                    await sleep(100);
                }
            }
            else{
                break;
            }
        }
    });

}


class Cell {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.walls = { left: false, right: false, up: false, down: false };
        this.teleport = null;
        this.switch = null;
        this.gate = null;
    }



    move(player, orientation, teleported){

        if(this.teleport && !teleported){
            let newX = this.teleport.x;
            let newY = this.teleport.y;
            if(isAnotherPlayerOnCell(newX, newY, player)){
                return null;
            }
            else{
                let nextCell = grid[newY][newX];
                checkForFood(nextCell);
                return {"cell": nextCell, "teleported": true};
            }
        }
 
        if(this.gate){
            let orient = this.gate.getGateOrientation();
            if(orient && orient == orientation){
                return null;
            }
        }
        let newX = player.x + directionDic[orientation][0];
        let newY = player.y + directionDic[orientation][1];

        if(isAnotherPlayerOnCell(newX, newY, player)){
            return null;
        }
        if(this.walls[orientation]){
            return null;
        }

        let nextCell = grid[newY][newX];
        checkForFood(nextCell);
        toggleSwitch(nextCell);
        return {"cell": nextCell, "teleported": false};
    }

    addSwitch(lever){
        this.switch = lever;
    }

    addGate(gate){
        this.gate = gate;
    }

    isTeleportActive(x, y){
        if(this.teleport != null){
            return x === this.teleport.x && y === this.teleport.y;
        }
        return false;
    }

    addTeleport(teleport){
        this.teleport = teleport;
    }

    addWalls(walls) {
        if (walls.length == 0){
            return;
        }
        walls.forEach(wall => {
            this.walls[wall] = true;
        });
    }

    draw() {
        const { x, y, size } = this;
        // Draw walls
        ctx.beginPath();

        if (this.walls.left) {
            ctx.moveTo(x * size, y * size);
            ctx.lineTo(x * size, (y + 1) * size);
        }
        if (this.walls.right) {
            ctx.moveTo((x + 1) * size, y * size);
            ctx.lineTo((x + 1) * size, (y + 1) * size);
        }
        if (this.walls.up) {
            ctx.moveTo(x * size, y * size);
            ctx.lineTo((x + 1) * size, y * size);
        }
        if (this.walls.down) {
            ctx.moveTo(x * size, (y + 1) * size);
            ctx.lineTo((x + 1) * size, (y + 1) * size);
        }
        ctx.stroke();

        if(this.teleport != null){
            this.drawTeleport();
        }
        if(this.switch != null){
            this.switch.draw();
        }
        if(this.gate != null){
            this.gate.draw();
        }
    }

    drawTeleport() {
        // Calculate the center and radius for the gradient
        const centerX = this.x * this.size + this.size / 2;
        const centerY = this.y * this.size + this.size / 2;
        const radiusX = this.size * 0.18; // 30% of the canvas width
        const radiusY = this.size * 0.35; // 40% of the canvas height
    
        // Create an elliptical gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(radiusX, radiusY));
        gradient.addColorStop(0, 'rgba(173, 216, 230, 1)'); // Light blue at the center
        gradient.addColorStop(0.5, 'rgba(135, 206, 250, 1)'); // Medium blue
        gradient.addColorStop(1, 'rgba(0, 47, 75, 1)'); // Dark blue at the edges
    
        // Draw the ellipse
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

class Player {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x * oneCellHeight + oneCellHeight / 2, this.y * oneCellHeight + oneCellHeight / 2, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
    }
}

class Food {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x * oneCellHeight + oneCellHeight / 2, this.y * oneCellHeight + oneCellHeight / 2, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }
}


class Gate {
    constructor(x, y, size, orientation, mySwitch) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.orientation = orientation;
        this.switch = mySwitch;
    }

    getGateOrientation(){
        if(this.switch.isOpen()){
            return null;
        }
        return this.orientation;
    }

    draw() {
        if(!this.switch.isOpen()){
            let fromX = this.orientation === 'right' ? (this.x + 1) * this.size : this.x * this.size;
            let fromY = this.orientation === 'down' ? (this.y + 1) * this.size : this.y * this.size;
            let toX = this.orientation === 'left' ? this.x * this.size : (this.x + 1) * this.size;
            let toY = this.orientation === 'up' ? this.y * this.size : (this.y + 1) * this.size;
    
    
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            ctx.restore();
        }
    }
}

class Switch {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.isOn = false;
    }

    isOpen(){
        return this.isOn;
    }

    toggleSwitch(){
        this.isOn = !this.isOn;
    }

    draw() {
        const baseX = this.x * this.size + this.size / 2 - this.size / 20;
        const baseY = (this.y + 1) * this.size;
        const baseWidth = this.size / 10;
        const baseHeight = -(this.size / 6);

        ctx.fillStyle = '#654321'; // Brown color for the lever base
        ctx.fillRect(baseX, baseY, baseWidth, baseHeight);
        ctx.strokeStyle = this.isOn ? 'green' : 'red'; // Color of the border
        ctx.lineWidth = 1; // Width of the border
        ctx.strokeRect(baseX, baseY, baseWidth, baseHeight);
        ctx.strokeStyle = 'black';
        const handleLength = -this.size / 4;
        const handleWidth = -this.size / 20;
        const handleX = baseX + baseWidth / 2;
        const handleY = baseY + baseHeight;

        ctx.save(); // Save the current context state
        ctx.translate(handleX, handleY);
        // Draw lever handle
        ctx.fillStyle = this.isOn ? 'green' : 'red'; // Green if on, red if off
        ctx.rotate(this.isOn ? -Math.PI / 4 : Math.PI / 4);
        ctx.fillRect(-handleWidth / 2, 0, handleWidth, handleLength);
        ctx.restore();
    }
}


gameStart(maps[0]);