
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
        const result = utilsFunc.GetQueueInSameDay(mockData, today);
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
        expect(() => utilsFunc.GetQueueInSameDay(invalidData, today)).toThrow('Missing "date_start" in one or more queue items');
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
        expect(() => utilsFunc.GetQueueInSameDay(invalidDateData, today)).toThrow(/Invalid date format/);
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

describe('process_next_queue', () => {
    const mockPatientData = [
        {
            name: "Khori",
            doctor_data: "Dr. Agus Septio",
            doctor_id: 1,
            date_start: "2025-05-27T12:00:00.000+07:00", // Today
            date_end: "2025-05-27T13:00:00.000+07:00",
            queue_number: "A1",
            queue_integer: 1,
            queue_letter: "A",
            is_done: false
        },
        {
            name: "Budi",
            doctor_data: "Dr. Peter",
            doctor_id: 2,
            date_start: "2025-05-27T10:00:00.000+07:00", // Today, A2 (lower queue_integer)
            date_end: "2025-05-27T11:00:00.000+07:00",
            queue_number: "A2", // This should be picked if A1 is done
            queue_integer: 2,
            queue_letter: "A",
            is_done: false
        },
        {
            name: "Cindy",
            doctor_data: "Dr. Agus Septio",
            doctor_id: 1,
            date_start: "2025-05-27T14:00:00.000+07:00", // Today, but A3
            date_end: "2025-05-27T15:00:00.000+07:00",
            queue_number: "A3",
            queue_integer: 3,
            queue_letter: "A",
            is_done: false
        },
        {
            name: "Siti",
            doctor_data: "Dr. Joko Anwar",
            doctor_id: 3,
            date_start: "2024-08-24T12:00:00.000+07:00", // Past date, should be ignored
            date_end: "2024-08-24T13:00:00.000+07:00",
            queue_number: "X1",
            queue_integer: 1,
            queue_letter: "X",
            is_done: false
        },
        {
            name: "Diana",
            doctor_data: "Dr. Peter",
            doctor_id: 2,
            date_start: "2025-05-27T09:00:00.000+07:00", // Today, already done
            date_end: "2025-05-27T09:30:00.000+07:00",
            queue_number: "A0",
            queue_integer: 0,
            queue_letter: "A",
            is_done: true // This one is already done
        }
    ];

    const todayFormatted = "2025-05-27"; 

    it('should find and mark the lowest pending queue for today as done', () => {
        const initialData = JSON.parse(JSON.stringify(mockPatientData)); 

        const result = utilsFunc.ProcessNextQueue(initialData, todayFormatted);

        expect(result.success).toBe(true);
        expect(result.nextQueue).not.toBeNull();
        expect(result.nextQueue.queue_number).toBe("A1"); 
        expect(result.nextQueue.is_done).toBe(true);
        expect(result.message).toContain('berhasil dilanjutkan');

        const updatedA1 = result.updatedData.find(p => p.queue_number === "A1" && moment.tz(p.date_start, tz).format('YYYY-MM-DD') === todayFormatted);
        expect(updatedA1.is_done).toBe(true);

        const A2 = result.updatedData.find(p => p.queue_number === "A2");
        expect(A2.is_done).toBe(false);
        const A0_done = result.updatedData.find(p => p.queue_number === "A0");
        expect(A0_done.is_done).toBe(true); 
    });

    it('should find the next available if the first one is already done', () => {
        const dataWithA1Done = JSON.parse(JSON.stringify(mockPatientData));
        dataWithA1Done[0].is_done = true; 

        const result = utilsFunc.ProcessNextQueue(dataWithA1Done, todayFormatted);

        expect(result.success).toBe(true);
        expect(result.nextQueue).not.toBeNull();
        expect(result.nextQueue.queue_number).toBe("A2");
        expect(result.nextQueue.is_done).toBe(true);
        expect(result.message).toContain('berhasil dilanjutkan');

        const updatedA2 = result.updatedData.find(p => p.queue_number === "A2" && moment.tz(p.date_start, tz).format('YYYY-MM-DD') === todayFormatted);
        expect(updatedA2.is_done).toBe(true);

        const A1_after = result.updatedData.find(p => p.queue_number === "A1");
        expect(A1_after.is_done).toBe(true);
    });


    it('should return success: false if no pending queues for today', () => {
        const allDoneData = [
            {
                name: "Khori",
                date_start: "2025-05-27T12:00:00.000+07:00",
                queue_number: "A1",
                queue_integer: 1,
                is_done: true 
            },
            {
                name: "Budi",
                date_start: "2025-05-27T10:00:00.000+07:00",
                queue_number: "A2",
                queue_integer: 2,
                is_done: true 
            },
            {
                name: "Past",
                date_start: "2024-05-27T10:00:00.000+07:00",
                queue_number: "X1",
                queue_integer: 1,
                is_done: false 
            }
        ];

        const result = utilsFunc.ProcessNextQueue(allDoneData, todayFormatted);

        expect(result.success).toBe(false);
        expect(result.nextQueue).toBeNull();
        expect(result.message).toContain('Tidak ada antrian yang menunggu');
    });

    it('should handle empty patient data gracefully', () => {
        const emptyPatientData = [];

        const result = utilsFunc.ProcessNextQueue(emptyPatientData, todayFormatted);
        console.log('should',result)

        expect(result.success).toBe(false);
        expect(result.nextQueue).toBeNull();
        expect(result.message).toContain('Tidak ada antrian yang menunggu');
    });
});

