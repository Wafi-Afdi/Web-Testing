
const moment = require('moment-timezone');
const utilsFunc = require('../utils');
const dataController = require("../controllers/dataController")

const tz = 'Asia/Jakarta';

describe('same_day_appointment', () => {

    const yesterday = moment.tz(tz).subtract(1, 'day').set({ hour: 12, minute: 0 }).format();
    const today = moment.tz(tz).set({ hour: 10, minute: 0 }).format();

    const mockData = [
        {
            name: "Yesterday",
            doctor_data: "Dr. A",
            doctor_id: 1,
            date_start: yesterday,
            date_end: moment.tz(yesterday, tz).add(1, 'hour').format(),
            queue_number: "A1",
            queue_integer: 1,
            queue_letter: "A"
        },
        {
            name: "Today",
            doctor_data: "Dr. B",
            doctor_id: 2,
            date_start: today,
            date_end: moment.tz(today, tz).add(1, 'hour').format(),
            queue_number: "B1",
            queue_integer: 2,
            queue_letter: "B"
        }
    ];

    it("should return only today's queue", () => {
        const result = utilsFunc.GetQueueInSameDay(mockData);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Today');
    });

    it('should throw an error if a queue item is missing date_start', () => {
        const invalidData = [
            ...mockData,
            {
                name: "Missing Date",
                doctor_data: "Dr. C",
                doctor_id: 3,
                //  date_start hilang
                queue_number: "C1",
                queue_integer: 3,
                queue_letter: "C"
            }
        ];
        expect(() => utilsFunc.GetQueueInSameDay(invalidData)).toThrow('Missing "date_start" in one or more queue items');
    });

    it('should throw an error if date_start is invalid format', () => {
        const invalidDateData = [
            ...mockData,
            {
                name: "Invalid Date",
                doctor_data: "Dr. D",
                doctor_id: 4,
                date_start: "not-a-date",
                queue_number: "D1",
                queue_integer: 4,
                queue_letter: "D"
            }
        ];
        expect(() => utilsFunc.GetQueueInSameDay(invalidDateData)).toThrow(/Invalid date format/);
    });
});

describe('search_doctor', () => {
    const doctor_data = dataController.loadData()?.doctors_data;

    it('should return correct index when search_doctor_id is a string', () => {
        const result = utilsFunc.CheckDoctorId(doctor_data, '2');
        expect(result).toBe(1);
    });

    it('should return correct index when search_doctor_id is an integer', () => {
        const result = utilsFunc.CheckDoctorId(doctor_data, 3);
        expect(result).toBe(2);
    });

    it('should return -1 when doctor ID is not found', () => {
        const result = utilsFunc.CheckDoctorId(doctor_data, 99);
        expect(result).toBe(-1);
    });
})

describe('add_new_patient', () => {
    const mockDb = {
        doctors_data: [
            { id: 1, name: "Dr. Agus Septio", spesialisasi: "Jantung" },
            { id: 2, name: "Dr. Peter", spesialisasi: "Penyakit dalam" },
            { id: 3, name: "Dr. Joko Anwar", spesialisasi: "Saraf" }
        ],
        patient_data: [
            {
                name: "Khori",
                doctor_data: "Dr. Agus Septio",
                doctor_id: 1,
                date_start: "2025-05-18T12:00:00.000+07:00",
                date_end: "2025-05-18T13:00:00.000+07:00",
                queue_number: "A1",
                queue_integer: 1,
                queue_letter: "A"
            },
            {
                name: "Siti",
                doctor_data: "Dr. Joko Anwar",
                doctor_id: 3,
                date_start: "2024-08-24T12:00:00.000+07:00",
                date_end: "2024-08-24T13:00:00.000+07:00",
                queue_number: "A2",
                queue_integer: 2,
                queue_letter: "A"
            }
        ]
    };

    it('should add a new patient with queue_integer = 3 on valid input', () => {
        const dbCopy = JSON.parse(JSON.stringify(mockDb));
        const patient_name = "Udin";
        const doctor_data = { id: 1, name: "Dr. Agus Septio" };
        const time_start = moment.tz("2025-05-18T14:00:00.000+07:00", tz).toISOString();
        const time_end = moment.tz("2025-05-18T15:00:00.000+07:00", tz).toISOString();

        const newPatient = utilsFunc.AddNewPatient(patient_name, dbCopy, time_start, doctor_data, time_end);

        expect(newPatient.queue_integer).toBe(2); // karena khori 1 
        expect(dbCopy.patient_data.length).toBe(3);
        expect(dbCopy.patient_data[2].name).toBe("Udin");
    });

    it('should throw an error when patient_name is missing', () => {
        const dbCopy = JSON.parse(JSON.stringify(mockDb));
        const doctor_data = { id: 1, name: "Dr. Agus Septio" };
        const time_start = moment.tz("2025-05-18T14:00:00.000+07:00", tz).toISOString();
        const time_end = moment.tz("2025-05-18T15:00:00.000+07:00", tz).toISOString();

        expect(() =>
            utilsFunc.AddNewPatient(null, dbCopy, time_start, doctor_data, time_end)
        ).toThrow('Invalid or missing patient_name');
    });
})
