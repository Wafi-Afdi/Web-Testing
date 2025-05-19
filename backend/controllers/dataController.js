const fs = require('fs')

// database sementara
const DATA_FILE = './database/data.json';
const TEST_FILE = './database/test_data.json'

function loadData(file = DATA_FILE, is_test = false) {
    let data;
    if(is_test) {
        data = fs.readFileSync(TEST_FILE);
    } else {
        data = fs.readFileSync(DATA_FILE);
    }
    
    return JSON.parse(data);
}

function saveData(data, file = DATA_FILE) {
    if (
        !data ||
        !Array.isArray(data.doctors_data) ||
        !Array.isArray(data.patient_data)
    ) {
        throw new Error("Data must contain 'doctors_data' and 'patient_data' as arrays");
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    loadData,
    saveData,
    TEST_FILE
}