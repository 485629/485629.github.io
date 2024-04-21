const mapGrid = document.getElementById('mapGrid');
let gridSize = 6; 
let currentPlayers = [];
let switchCell;
const directionDic = {"down": [0,1], "up": [0,-1], "left": [-1,0], "right": [1,0]}
const oppositeDirDic= {"down": "up", "up": "down", "left": "right", "right": "left"}

function createGrid(size) {
    gridSize = size;
    const cellSize = 800 / gridSize;
    mapGrid.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
    mapGrid.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.x = x;
            cell.dataset.y = y;

            // Add default walls for the perimeter
            if (x === 0) cell.classList.add('has-left-wall');
            if (x === gridSize - 1) cell.classList.add('has-right-wall');
            if (y === 0) cell.classList.add('has-up-wall');
            if (y === gridSize - 1) cell.classList.add('has-down-wall');

            mapGrid.appendChild(cell);
        }
    }
}

createGrid(gridSize);

window.updateGridSize = function (){
    const newSize = parseInt(document.getElementById('gridSizeInput').value, 10);
    if (newSize && newSize > 0) {
        gridSize = newSize;
        mapGrid.innerHTML = ''; // Clear existing grid
        createGrid(gridSize);
    }
}
let selectedTool = 'wall'; 
let selectedOrientation = '';
const selectedToolDisplay = document.getElementById('selectedToolDisplay');

function updateSelectedTool(toolName) {
    selectedTool = toolName;
    selectedToolDisplay.textContent = `Selected Tool: ${selectedTool}`;
}

function updateSelectedOrientation(orientation) {
    selectedOrientation = orientation;
    selectedToolDisplay.textContent = `Selected Tool: ${selectedTool}, Orientation: ${selectedOrientation}`;
}

updateSelectedTool('None');

document.getElementById('toolSelector').addEventListener('change', function() {
    updateSelectedTool(this.value);
    const orientationDiv = document.getElementById('orientationSelector');

    // Show the orientation selector only for "Wall" and "Gate"
    if (selectedTool === 'wall' || selectedTool === 'gate') {
        orientationDiv.style.display = 'block';
        updateSelectedOrientation('up');
    } else {
        orientationDiv.style.display = 'none';
    }
});

document.getElementById('orientation').addEventListener('change', function() {
    updateSelectedOrientation(this.value);
});

document.getElementById('importMap').addEventListener('click', () => {
    const fileInput = document.getElementById('jsonFileInput');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const mapData = JSON.parse(e.target.result);
                loadMap(mapData);
            } catch (e) {
                console.error('Invalid JSON:', e);
            }
        };
        reader.readAsText(file);
    }
});

function loadMap(mapData) {
    // First, clear any existing grid or map settings
    mapGrid.innerHTML = '';

    // Then, create the grid based on the imported map data
    createGrid(mapData.gridSize);

    // Set up the cells based on the map data
    mapData.cells.forEach(cellData => {
        const cell = document.querySelector(`.grid-cell[data-x="${cellData.x}"][data-y="${cellData.y}"]`);
        if (cell) {
            // Set walls
            if (cellData.walls.includes('left')) cell.classList.add('has-left-wall');
            if (cellData.walls.includes('right')) cell.classList.add('has-right-wall');
            if (cellData.walls.includes('up')) cell.classList.add('has-up-wall');
            if (cellData.walls.includes('down')) cell.classList.add('has-down-wall');

            // Set food
            if (cellData.food) cell.classList.add('has-food');

        }
    });

    currentPlayers = [];
    mapData.players.forEach(player => {
        const cell = document.querySelector(`.grid-cell[data-x="${player.x}"][data-y="${player.y}"]`);
        cell.classList.add('has-player');
        currentPlayers.push(cell);
    });

    if(mapData.teleports != null){
        const fromX = mapData.teleports[0].x;
        const fromY = mapData.teleports[0].y;
        const toX = mapData.teleports[1].x;
        const toY = mapData.teleports[1].y;
        const cellFrom = document.querySelector(`.grid-cell[data-x="${fromX}"][data-y="${fromY}"]`);
        const cellTo = document.querySelector(`.grid-cell[data-x="${toX}"][data-y="${toY}"]`);

        cellFrom.classList.add('has-teleport');
        cellTo.classList.add('has-teleport');
    }
    if(mapData.gate != null){
        const cellOne = document.querySelector(`.grid-cell[data-x="${mapData.gate.cells[0].x}"][data-y="${mapData.gate.cells[0].y}"]`);
        const cellTwo = document.querySelector(`.grid-cell[data-x="${mapData.gate.cells[1].x}"][data-y="${mapData.gate.cells[1].y}"]`);
        cellOne.classList.add(`has-${mapData.gate.cells[0].orientation}-gate`);
        cellTwo.classList.add(`has-${mapData.gate.cells[1].orientation}-gate`);
        switchCell = document.querySelector(`.grid-cell[data-x="${mapData.gate.switch.x}"][data-y="${mapData.gate.switch.y}"]`);
        switchCell.classList.add('has-switch');
    }
}


mapGrid.addEventListener('click', (event) => {
    if (event.target.classList.contains('grid-cell')) {
        const cell = event.target;
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);

        switch (selectedTool) {
            case 'wall':
                switch(selectedOrientation){
                case 'right':
                    toggleWall(cell, 'has-right-wall');
                    if (x < gridSize - 1) {
                        const rightCell = document.querySelector(`.grid-cell[data-x="${x + 1}"][data-y="${y}"]`);
                        toggleWall(rightCell, 'has-left-wall');
                    }
                    break;
                case 'left':
                    toggleWall(cell, 'has-left-wall');
                    if (x > 0) {
                        const leftCell = document.querySelector(`.grid-cell[data-x="${x - 1}"][data-y="${y}"]`);
                        toggleWall(leftCell, 'has-right-wall');
                    }
                    break;
                case 'up':
                    toggleWall(cell, 'has-up-wall');
                    if (y > 0) {
                        const upperCell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y - 1}"]`);
                        toggleWall(upperCell, 'has-down-wall');
                    }
                    break;
                case 'down':
                    toggleWall(cell, 'has-down-wall');
                    if (y < gridSize - 1) {
                        const lowerCell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y + 1}"]`);
                        toggleWall(lowerCell, 'has-up-wall');
                    }
                    break;
                }
                break;
            
            case 'food':
                cell.classList.toggle("has-food");
                break;
            case 'player':
                if (cell.classList.contains('has-player')) {
                    // Remove the player from this cell
                    cell.classList.remove('has-player');
                    currentPlayers = currentPlayers.filter(p => p !== cell);
                } else if (currentPlayers.length < 2) {
                    // Add a new player
                    cell.classList.add('has-player');
                    currentPlayers.push(cell);
                } else {
                    // Remove the oldest player and add a new one
                    const oldestPlayerCell = currentPlayers.shift();
                    oldestPlayerCell.classList.remove('has-player');
                    cell.classList.add('has-player');
                    currentPlayers.push(cell);
                }
                break;
            case 'teleport':
                cell.classList.toggle("has-teleport");
                break;
            case 'switch':
                if(switchCell != null && switchCell.classList.contains("has-switch")){
                    switchCell.classList.toggle("has-switch");
                    switchCell = null;
                    break;
                }
                switchCell = cell;
                cell.classList.toggle("has-switch");
                break;
            case 'gate':
                if(!cell.classList.contains(`has-${selectedOrientation}-wall`))
                {
                    let newX = directionDic[selectedOrientation][0] + x
                    let newY = directionDic[selectedOrientation][1] + y
                    const anotherCell = document.querySelector(`.grid-cell[data-x="${newX}"][data-y="${newY}"]`);
                    cell.classList.toggle(`has-${selectedOrientation}-gate`);
                    anotherCell.classList.toggle(`has-${oppositeDirDic[selectedOrientation]}-gate`);
                }
                break;
    }
    }
});

function toggleWall(cell, wallClass) {
    if (cell) {
        cell.classList.toggle(wallClass);
    }
}


document.getElementById('displayMapData').addEventListener('click', () => {
    let mapData = getMapData();
    const formattedJSON = formatJSONFirstLevel(mapData);
    const mapDataDisplay = document.getElementById('mapDataDisplay');
    mapDataDisplay.textContent = formattedJSON;
    console.log(formattedJSON);
});


function getMapData(){
    const mapData = {
        gridSize: gridSize,
        players: [], // To store the start position
        foodCount: 0,
        cells: []
    };
    let playerColor = "red";
    const regex = /\bgate\b/i;
    let teleports = [];
    let gate = {'cells': [], switch: {}}

    document.querySelectorAll('.grid-cell').forEach(cell => {
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);
        let cellWalls = [];
        if(cell.classList.contains('has-left-wall')){
            cellWalls.push("left");
        }
        if(cell.classList.contains('has-right-wall')){
            cellWalls.push("right");
        }
        if(cell.classList.contains('has-up-wall')){
            cellWalls.push("up");
        }
        if(cell.classList.contains('has-down-wall')){
            cellWalls.push("down");
        }

        hasFood = cell.classList.contains('has-food')
        if(hasFood){
            mapData.foodCount += 1;
        }

        const cellData = {
            x: x,
            y: y,
            walls: cellWalls,
            food: hasFood
        };


        
        if(Array.from(cell.classList).some(className => regex.test(className))){
            let orient;
            cell.classList.forEach(className => {
                if (className.includes('gate')){
                    orient = className.split('-')[1];
                }
            });
            gate['cells'].push({
                "orientation": orient, "x": x, "y": y
            });
        }
        if (cell.classList.contains('has-teleport')){
            teleports.push({x: x, y: y});
        }

        if (cell.classList.contains('has-player')) {
            mapData.players.push({ x: x, y: y, color: playerColor });
            playerColor = playerColor === "red" ? "orange" : "red";
        }


        mapData.cells.push(cellData);
    });


    if(teleports.length == 2){
        mapData.teleports = [
            { x: teleports[0].x, y: teleports[0].y },
            { x: teleports[1].x, y: teleports[1].y }
        ];
    }

    if(switchCell != null){
        gate["switch"] = {x: parseInt(switchCell.dataset.x, 10), y: parseInt(switchCell.dataset.y, 10)};
        mapData.gate = gate;
    }

    return mapData;
}




function formatJSONFirstLevel(obj) {
    let result = '{\n';
    const keys = Object.keys(obj);
    keys.forEach((key, index) => {
        if (key === 'cells' || key === "players" || key === "teleports") {
            result += `  "${key}": [\n`;
            obj[key].forEach((cell, cellIndex) => {
                result += '      {';
                const cellKeys = Object.keys(cell);
                let comma = false;
                cellKeys.forEach((cellKey, cellKeyIndex) => {
                    if (cellKey === 'food' && !cell[cellKey]) return;
                    if (comma){
                        result += ', ';
                    }
                    result += `"${cellKey}": ${JSON.stringify(cell[cellKey])}`;
                    comma = true;
                });
                result += '}';
                if (cellIndex < obj[key].length - 1) {
                    result += ',';
                }
                result += '\n';
            });
            result += '  ]';
        } 
        else {
            result += `  "${key}": ${JSON.stringify(obj[key], null, 6).replace("}", "  }")}`;
        }
        if (index < keys.length - 1) {
            result += ',';
        }
        result += '\n';
    });
    result += '}';
    return result;
}