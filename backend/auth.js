const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
  access_token: process.env.ACCESS_TOKEN,
  refresh_token: process.env.REFRESH_TOKEN,
  scope: "https://www.googleapis.com/auth/youtube.force-ssl",
  token_type: "Bearer",
  expiry_date: Date.now() + 3600 * 1000,
});

module.exports = { oauth2Client };
