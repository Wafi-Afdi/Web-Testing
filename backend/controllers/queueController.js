const asyncHandler = require('express-async-handler')
const dataController = require("./dataController")

const moment = require('moment-timezone');
const utilsFunc = require("../utils")

const tz = 'Asia/Jakarta';


/**
 * GET /queue/all
 * mengambil semua antrian yang ada
*/
const GetAllPatientQueue = asyncHandler(async (req, res, next) => {
    const { all } = req.query
    const data = dataController.loadData();
    let queue_data = data.patient_data
    const now = moment.tz(tz)

    if (all == 'true') {
        return res.status(201).json({ queue: [...queue_data], message: "Antrian berhasil diambil" })

    } else {
        queue_data = utilsFunc.GetQueueInSameDay(queue_data, now)
        return res.status(201).json({ queue: [...queue_data], message: "Antrian berhasil diambil" })
    }

})

/**
 * GET /queue/doctors
 * mengambil semua data dokter yang ada
*/
const GetAllDoctorList = asyncHandler(async (req, res, next) => {
    const data = dataController.loadData();
    const queue_data = data.doctors_data
    return res.status(201).json({ doctors: [...queue_data], message: "Dokter berhasil diambil" })
})

/**
 * PATCH /queue/next
 * ambil next antrean
*/
const PatchNextQueue = asyncHandler(async (req, res, next) => {
    const data = dataController.loadData();
    let queue_data = data.patient_data
    const now = moment.tz(tz)

    const result = utilsFunc.ProcessNextQueue(queue_data);

    
    if (result.success) {
        data.patient_data = result.updatedData;
        dataController.saveData(data); 

        return res.status(200).json({
            next_queue: result.updatedPatient,
            message: result.message
        });
    } else {
        return res.status(404).json({
            next_queue: {},
            message: result.message
        });
    }

})



/**
 * POST /queue/
 * membuat antrian terbaru
*/
const NewPatientQueue = asyncHandler(async (req, res, next) => {
    const { patient_name, doctor_id, date_start, date_end } = req.body

    const loaded_database = dataController.loadData();
    const doctor_db = loaded_database.doctors_data

    // check doctor
    const doctor_exist_index = utilsFunc.CheckDoctorId(doctor_db, doctor_id)
    if(doctor_exist_index < 0) {
        return res.status(400).json({ message: "Dokter tidak ditemukan" })
    }

    // upload data
    const new_patient = utilsFunc.AddNewPatient(patient_name, loaded_database, date_start, doctor_db[doctor_exist_index], date_end)

    dataController.saveData(loaded_database)

    return res.status(201).json({ new_patient: new_patient, message: "Pasien berhasil ditambahkan" })

})
module.exports = {
    GetAllPatientQueue,
    NewPatientQueue,
    GetAllDoctorList,
    PatchNextQueue
}