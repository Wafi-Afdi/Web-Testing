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

    if (all == 'true') {
        return res.status(201).json({ queue: [...queue_data], message: "Antrian berhasil diambil" })

    } else {
        queue_data = utilsFunc.GetQueueInSameDay(queue_data)
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
    GetAllDoctorList
}