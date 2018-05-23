const functions = require('firebase-functions');
const firebase = require('firebase');
const rp = require('request-promise');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const WRONG_REQUEST_TYPE = 405;
const OK = 200;

module.exports = {

  /*Response example:
  {
    "access_token": "xoxp-XXXXXXXX-XXXXXXXX-XXXXX",
    "scope": "incoming-webhook,commands,bot",
    "team_name": "Team Installing Your Hook",
    "team_id": "XXXXXXXXXX",
    "incoming_webhook": {
        "url": "https://hooks.slack.com/TXXXXX/BXXXXX/XXXXXXXXXX",
        "channel": "#channel-it-will-post-to",
        "configuration_url": "https://teamname.slack.com/services/BXXXXX"
    },
    "bot":{
        "bot_user_id":"UTTTTTTTTTTR",
        "bot_access_token":"xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT"
    }
  }
  */
  oauthRedirect: function(req, res) {
        //Check if this is the GET request
        if (req.method !== "GET") {
            console.error(`Got unsupported ${req.method} request. Expected GET.`);
            res.contentType('json').status(WRONG_REQUEST_TYPE).send({
                "Status": "Failure - Only GET requests are accepted"
            });
            return;
        }

        //Check if we have code in the request query
        if (!req.query && !req.query.code) {
            res.contentType('json').status(UNAUTHORIZED).send({
                "Status": "Failure - Missing query attribute 'code'"
            });
            return;
        }

        //Create the oauth.success request to Slack API
        const options = {
            uri: "https://slack.com/api/oauth.access",
            method: "GET",
            json: true,
            qs: {
                code: req.query.code,
                client_id: functions.config().slack.id,
                client_secret: functions.config().slack.secret
            }
        };

        //Execute request to Slack API
        rp(options)
            .then(slackResponse => {
                //Check the response value
                console.log("Repos: ", slackResponse);
                if (!slackResponse.ok) {
                    console.error("The request was not ok: " + JSON.stringify(slackResponse));
                    res.contentType('json').status(UNAUTHORIZED).send({
                        "Status": "Failure - No response from Slack API"
                    });
                    return;
                }
                saveWorkspaceAsANewInstallation(slackResponse, response);
                return;
            })
            .catch(err => {
                //Handle the error
                console.log("Error: ", err);
                res.contentType('json').status(UNAUTHORIZED).send({
                    "Status": "Failure - request to Slack API has failed"
                });
                return;
            });
  },

  saveWorkspaceAsANewInstallation: function (slackResponse, response) {
      //Add the entry to the database
      database.ref('installations/' + slackResponse.team_id).set({
          token: slackResponse.access_token,
          team: slackResponse.team_id,
          webhook: {
              url: slackResponse.incoming_webhook.url,
              channel: slackResponse.incoming_webhook.channel_id
          }
      }).then(ref => {
          //Success!!!
          response.contentType('json').status(OK).send({
              "Status": "Success"
          });
          return;
      }).catch(err => {
          console.log('Error setting document', err);
          response.contentType('json').status(UNAUTHORIZED).send({
              "Failure": "Failed to save data in the DB"
          });
          return;
      });
  }

};
