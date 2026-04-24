const axios = require('axios');
const config = require('../../config');

const { loginUrl, username, password, realm } = config.auth;

async function getToken() {
  if (!password) {
    throw new Error('Missing TDC_AUTH_PASSWORD environment variable');
  }

  try {
    const response = await axios.post(
      loginUrl,
      { username, password, realm },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.token;
  } catch (error) {
    console.error('Blad przy pobieraniu tokena:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getToken };
