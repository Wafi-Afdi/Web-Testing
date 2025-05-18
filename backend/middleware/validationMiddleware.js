const { check, validationResult, param, query, body } = require('express-validator');

const validateAppointment = [
    body('patient_name')
        .isString()
        .withMessage('patient_name must be a string')
        .isLength({ max: 50 })
        .withMessage('patient_name max length is 50'),

    body('doctor_id')
        .isInt()
        .withMessage('doctor_id must be an integer'),

    body('date_start')
        .isISO8601()
        .withMessage('time_start must be a valid timestamp'),

    body('date_end')
        .isISO8601()
        .withMessage('time_end must be a valid timestamp')
        .custom((value, { req }) => {
            const start = new Date(req.body.time_start);
            const end = new Date(value);

            if (end < start) {
                throw new Error('time_end must be greater than or equal to time_start');
            }
            return true;
        })
    ,
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateGetQueue = [
    query('all')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('all must be either "true" or "false"'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];


module.exports = {
    validateAppointment,
    validateGetQueue
}