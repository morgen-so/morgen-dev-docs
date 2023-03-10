const jwt = require('jsonwebtoken');

function generateJWTUserToken() {
    const jwt = require('jsonwebtoken');
    const { CLIENT_API_KEY } = process.env;
    const payload = {
        "iss": "your-client-id",
        "sub": "user-id",
        // Optional payload fields
        "given_name": "John",
        "middle_name": "Jacob",
        "family_name": "Doe",
        "email": "john@example.com",
    };
    return jwt.sign(payload, CLIENT_API_KEY, {
        expiresIn: 600, // 10 minutes
    });
}