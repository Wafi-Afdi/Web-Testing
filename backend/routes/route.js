const express = require('express')
const router = express.Router();

const queueController = require("../controllers/queueController")
const validationMiddleware = require("../middleware/validationMiddleware")

router.get("/", validationMiddleware.validateGetQueue, queueController.GetAllPatientQueue)
router.post("/", validationMiddleware.validateAppointment, queueController.NewPatientQueue)
router.get("/doctors", queueController.GetAllDoctorList)
router.patch("/next", queueController.PatchNextQueue)

module.exports = router