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
        queue_letter: "A",
        is_done: false
    }

    db.patient_data = [...db.patient_data, new_patient_data]

    return new_patient_data
}

const ProcessNextQueue = (patientData, currentDate = moment.tz(tz).format('YYYY-MM-DD')) => {
    let nextQueue = null;
    let success = false;
    let message = '';

    const mutablePatientData = JSON.parse(JSON.stringify(patientData));

    const todaysPendingQueues = mutablePatientData.filter(patient => {
        const patientDate = moment.tz(patient.date_start, tz).format('YYYY-MM-DD');
        return patientDate === currentDate && patient.is_done === false;
    });

    todaysPendingQueues.sort((a, b) => a.queue_integer - b.queue_integer);

    if (todaysPendingQueues.length > 0) {
        nextQueue = todaysPendingQueues[0];

        const indexToUpdate = mutablePatientData.findIndex(p =>
            p.name === nextQueue.name &&
            p.queue_number === nextQueue.queue_number &&
            moment.tz(p.date_start, tz).format('YYYY-MM-DD') === currentDate
        );

        if (indexToUpdate !== -1) {
            mutablePatientData[indexToUpdate].is_done = true;
            nextQueue = mutablePatientData[indexToUpdate]; 
            success = true;
            message = `Antrian ${nextQueue.queue_number} (${nextQueue.name}) berhasil dilanjutkan.`;
        }
    }

    if (!success) {
        message = `Tidak ada antrian yang menunggu atau semua antrian untuk hari ini (${currentDate}) sudah selesai.`;
    }

    return {
        success,
        nextQueue,
        message,
        updatedData: mutablePatientData 
    };
};

module.exports = {
    GetQueueInSameDay,
    CheckDoctorId,
    AddNewPatient,
    ProcessNextQueue
}