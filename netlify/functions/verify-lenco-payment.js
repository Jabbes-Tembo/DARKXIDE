const axios = require('axios');

const allowedOrigins = [
  'https://darkxide-1eb8c.web.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

exports.handler = async function (event) {
  const origin = event.headers.origin;
  const corsHeaders = allowedOrigins.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {};

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { reference } = JSON.parse(event.body);

    if (!reference) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Payment reference is required' }) };
    }

    const secretKey = process.env.LENCO_SECRET_KEY;

    // --- CORRECTION ---
    // This is the correct verification URL discovered from your working GreenRoots demo.
    const apiUrl = `https://api.lenco.co/access/v2/transactions/verify/${reference}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    if (response.data && response.data.status === true && response.data.data && response.data.data.status === "successful") {
      // This is where you would save the order to your Firestore database.
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Payment verified successfully', data: response.data }),
      };
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Payment verification failed', data: response.data }),
      };
    }
  } catch (error) {
    console.error('Verification error:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to verify payment with Lenco.' }),
    };
  }
};