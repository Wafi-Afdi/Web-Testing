
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
    const doctor_data = dataController.loadData(is_test=true)?.doctors_data;

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
