const moment = require('moment-timezone');
const dataController = require("./controllers/dataController")

const tz = 'Asia/Jakarta';

const GetQueueInSameDay = (queue_data, time_data) => {
    const result = [];


    for (const item of queue_data) {
        if (!item.hasOwnProperty('date_start')) {
            throw new Error('Missing "date_start" in one or more queue items');
        }

        const itemDate = moment.tz(item.date_start, tz);

        if (!itemDate.isValid()) {
            throw new Error(`Invalid date format for "date_start": ${item.date_start}`);
        }
        if (itemDate.isSame(time_data, 'date')) {
            result.push(item);
        }
    }
    return result;
}


const CheckDoctorId = (doctor_data, search_doctor_id) => {
    const indexDoctorId = doctor_data.findIndex((element, index, array) => {
        return element.id == search_doctor_id
    });
    return indexDoctorId
}


const AddNewPatient = (patient_name, db, time_start, doctor_data, time_end) => {
    // Validate required fields
    if (!patient_name || typeof patient_name !== 'string') {
        throw new Error('Invalid or missing patient_name');
    }

    if (!db || typeof db !== 'object' || !Array.isArray(db.patient_data)) {
        throw new Error('Invalid or missing db or db.patient_data');
    }

    if (!time_start || !moment(time_start).isValid()) {
        throw new Error('Invalid or missing time_start');
    }

    if (!time_end || !moment(time_end).isValid()) {
        throw new Error('Invalid or missing time_end');
    }

    if (
        !doctor_data ||
        typeof doctor_data !== 'object' ||
        typeof doctor_data.name !== 'string' ||
        (typeof doctor_data.id !== 'string' && typeof doctor_data.id !== 'number')
    ) {
        throw new Error('Invalid or missing doctor_data');
    }

    const patient_queue = db.patient_data
    //console.log(patient_queue)

    const item_day = moment.tz(time_start, tz);
    const same_day_queue = GetQueueInSameDay(patient_queue, item_day)
    let highestQueueInteger = 0;
    //console.log(same_day_queue)

    for (const item of same_day_queue) {
        //console.log("QUEUE ITEM", item.queue_integer, "MAX", highestQueueInteger);
        if (item.queue_integer > highestQueueInteger) {
            highestQueueInteger = item.queue_integer;
        }
    }

    const new_patient_data = {
        name: patient_name,
        doctor_data: doctor_data.name,
        doctor_id: doctor_data.id,
        date_start: time_start,
        date_end: time_end,
        queue_number: "A" + (highestQueueInteger + 1),
        queue_integer: highestQueueInteger + 1,
        queue_letter: "A"
    }

    db.patient_data = [...db.patient_data, new_patient_data]

    return new_patient_data
}

module.exports = {
    GetQueueInSameDay,
    CheckDoctorId,
    AddNewPatient
}