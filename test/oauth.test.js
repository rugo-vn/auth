import * as dotenv from 'dotenv';
import process from 'node:process';
import http from 'node:http';
import open from 'open';
import { google } from 'googleapis';
import { parse as parseQuerytring } from 'node:querystring';
import { parse as parseUrl } from 'node:url';
import { expect } from 'chai';

dotenv.config();

function openServer() {
  return new Promise(async (resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parseUrl(req.url);
      const parsedQuery = parseQuerytring(parsedUrl.query);

      resolve(parsedQuery.code);
      res.end('You can close this tab and back to the terminal to see result.');

      server.close();
    });

    server.listen(8080);
  });
}

describe('OAuth test', function () {
  this.timeout(60000);

  it('should google oauth', async () => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:8080/api/v1/callback'
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ];

    const url = oauth2Client.generateAuthUrl({
      scope: scopes,
    });

    open(url);

    console.log(
      `If browser does not open automatically, you can do it manually: ${url}`
    );

    const code = await openServer();

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    expect(ticket.payload).to.has.property('email');
    expect(ticket.payload).to.has.property('email_verified');

    console.log(ticket.payload);
  });
});
