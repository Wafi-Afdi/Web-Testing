const fs = require('fs');
const dbController = require('../controllers/dataController');

jest.mock('fs');

describe('saveData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should save valid structured data', () => {
        const validData = {
            doctors_data: [
                { id: 1, name: "Dr. Agus Septio", spesialisasi: "Jantung" },
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
                }
            ]
        };

        dbController.saveData(validData, dbController.TEST_FILE);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            dbController.TEST_FILE,
            JSON.stringify(validData, null, 2)
        );
    });

    it('should throw error if doctors_data is missing', () => {
        const invalidData = {
            patient_data: [],
        };

        expect(() => dbController.saveData(invalidData,dbController.TEST_FILE)).toThrow("Data must contain 'doctors_data' and 'patient_data' as arrays");
    });

    it('should throw error if patient_data is not an array', () => {
        const invalidData = {
            doctors_data: [],
            patient_data: "not-an-array"
        };

        expect(() => dbController.saveData(invalidData, dbController.TEST_FILE)).toThrow("Data must contain 'doctors_data' and 'patient_data' as arrays");
    });

    it('should throw error if entire data object is missing', () => {
        expect(() => dbController.saveData(null, dbController.TEST_FILE)).toThrow("Data must contain 'doctors_data' and 'patient_data' as arrays");
    });
});
