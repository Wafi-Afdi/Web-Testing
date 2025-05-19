const moment = require('moment-timezone');
const dataController = require("./controllers/dataController")

const tz = 'Asia/Jakarta';

const GetQueueInSameDay = (queue_data) => {
    const result = [];
    const now = moment.tz(tz);
    

    for (const item of queue_data) {
        if (!item.hasOwnProperty('date_start')) {
            throw new Error('Missing "date_start" in one or more queue items');
        }

        const itemDate = moment.tz(item.date_start, tz);

        if (!itemDate.isValid()) {
            throw new Error(`Invalid date format for "date_start": ${item.date_start}`);
        }
        if (itemDate.isSame(now, 'date')) {
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
    const patient_queue = db.patient_data

    const same_day_queue = GetQueueInSameDay(patient_queue, moment.tz(tz))
    const highestQueueInteger = same_day_queue.reduce((max, item) => {
        return item.queue_integer > max ? item.queue_integer : max;
    }, 1);

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