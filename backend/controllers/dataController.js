const fs = require('fs')

// database sementara
const DATA_FILE = './database/data.json';

function loadData() {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    loadData,
    saveData
}