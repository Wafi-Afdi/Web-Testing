let allowedOrigins = ['http://localhost:3000'];

const corsConfig = () => {
    return {
        origin: true,
        credentials: true
    }
}

module.exports = corsConfig