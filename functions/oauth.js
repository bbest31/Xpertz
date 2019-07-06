const functions = require('firebase-functions');
const firebase = require('firebase');
const rp = require('request-promise');
const http = require('http');
const request = require('request');
const bot = require('./bot');

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
    oauthRedirect: function (req, res) {
        //Check if this is the GET request
        if (req.method !== "GET") {
            console.error(`Got unsupported ${req.method} request. Expected GET.`);
            res.redirect('http://xpertzsoftware.com?integration=failure');
            return;
        }

        //Check if we have code in the request query
        if (!req.query && !req.query.code) {
            // Missing query attribute
            res.redirect('http://xpertzsoftware.com?integration=failure');
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
                console.log(JSON.stringify(slackResponse));
                //Check the response value
                if (!slackResponse.ok) {
                    console.error("The request was not ok: " + JSON.stringify(slackResponse));
                    res.redirect('http://xpertzsoftware.com?integration=failure');
                    return;
                }
                this.linkWorkspaceToOrg(slackResponse, res);
                return;
            })
            .catch(err => {
                if (err) console.log(err);
                res.redirect('http://xpertzsoftware.com?integration=failure');
                return;
            });
    },

    /**
     * 
     * @param {*} slackResponse 
     * @param {*} response
     * @todo Figure out how we can identify which org the install request is coming from.
     */
    linkWorkspaceToOrg: function (slackResponse, response) {
        let org_id = '1';
        database.ref('organizations/' + org_id).once('value').then(snapshot => {
            if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                // This team exists so we add slack info to the account
                let updates = {
                    slack_bot_token: slackResponse.bot.bot_access_token,
                    slack_team_id: slackResponse.team_id,
                    slack_enterprise_id: null,
                    slack_token: slackResponse.access_token,

                };
                database.ref('organizations/' + org_id).update(updates).catch(err => {
                    console.log("Unabled to add slack credentials to existing org: ", err);
                    return;
                });
                // Alter redirect back to dashboard.
                response.redirect('http://xpertzsoftware.com?integration=alreadyinstalled');

                // DM the primary owner with an onboarding message.
                bot.onboardInstallerMsg(slackResponse.user_id, slackResponse.team_id);

                // Get the workspace name and enterprise name to store.
                request.get('https://slack.com/api/team.info?token=' + slackResponse.bot.bot_access_token, (err, res, body) => {
                    if (err) {
                        return console.log("Could not retrieve workspace enterprise id: ", err);
                    } else {
                        var payload = JSON.parse(body);
                        //console.log(payload);
                        if (payload.ok) {
                            database.ref('organizations/' + org_id).transaction(teamNode => {
                                //Check for enterprise id
                                if (payload.enterprise_id) {
                                    teamNode.slack_enterprise_id = payload.enterprise_id;
                                }
                                return teamNode;
                            });
                        } else {
                            console.log("https://slack.com/api/team.info: ", payload.error);
                        }
                    }
                });
                return;
            } else {
                // This request did not come from an existing organization.

                return;
            }

        }).catch(err => {
            console.log('linkWorkspaceToOrg Error:', err);
        });
    }
}