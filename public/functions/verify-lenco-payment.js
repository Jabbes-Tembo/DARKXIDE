// This code is designed for a Netlify serverless function environment.
// It replicates the logic from your verify-payment.php file.

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { reference } = JSON.parse(event.body);

        if (!reference) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Payment reference is required' }),
            };
        }

        // **IMPORTANT**: This is your Lenco secret key from verify-payment.php
        const secretKey = '04873530d16294fe5d6f8055d60e7a711231dcfc029f52291746c259cafcbdf6';
        const apiUrl = `https://api.lenco.co/v2/transactions/verify/${reference}`;

        const lencoResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
            },
        });

        const responseData = await lencoResponse.json();

        if (!lencoResponse.ok || responseData.status !== 'success') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Payment verification failed', data: responseData }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Payment verified successfully', data: responseData }),
        };

    } catch (error) {
        console.error('Verification Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to verify payment with Lenco' }),
        };
    }
};