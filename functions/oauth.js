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
            // res.contentType('json').status(WRONG_REQUEST_TYPE).send({
            //     "Status": "Failure - Only GET requests are accepted"
            // });
            res.redirect('http://xpertzsoftware.com?integration=failure');
            return;
        }

        //Check if we have code in the request query
        if (!req.query && !req.query.code) {
            // res.contentType('json').status(UNAUTHORIZED).send({
            //     "Status": "Failure - Missing query attribute 'code'"
            // });
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
                //Check the response value
                if (!slackResponse.ok) {
                    console.error("The request was not ok: " + JSON.stringify(slackResponse));
                    res.redirect('http://xpertzsoftware.com?integration=failure');
                    // res.contentType('json').status(UNAUTHORIZED).send({
                    //     "Status": "Failure - No response from Slack API"
                    // });
                    return;
                }
                this.saveWorkspaceAsANewInstallation(slackResponse, res);
                return;
            })
            .catch(err => {
                if (err) console.log(err);
                //Handle the error
                // res.contentType('json').status(UNAUTHORIZED).send({
                //     "Status": "Failure - request to Slack API has failed"
                // });
                res.redirect('http://xpertzsoftware.com?integration=failure');
                return;
            });
    },

    saveWorkspaceAsANewInstallation: function (slackResponse, response) {
        // console.log("slackResponse: " + JSON.stringify(slackResponse));

        database.ref('installations/' + slackResponse.team_id).once('value').then(snapshot => {
            if (!snapshot.val()) {
                // Add the entry to the database
                database.ref('installations/' + slackResponse.team_id).set({
                    token: slackResponse.access_token,
                    bot_token: slackResponse.bot.bot_access_token,
                    team: slackResponse.team_id,
                    name: 'unknown',
                    enterprise: 'none',
                    access: {
                        startedTrial: Date.now(),
                        tier: 0
                    }
                }).then(ref => {
                    // Success!!!
                    response.redirect('http://xpertzsoftware.com?integration=success');
                    // Increment installation count
                    database.ref('globals').transaction(globalNode => {
                        if(globalNode){
                            globalNode.installations++;
                        };
                        return globalNode;
                    });
                    // DM the primary owner with an onboarding message.
                    bot.onboardInstallerMsg(slackResponse.user_id, slackResponse.team_id);
                    // Get the workspace name and enterprise name to store.
                    request.get('https://slack.com/api/team.info?token=' + slackResponse.bot.bot_access_token, (err, res, body) => {
                        if (err) {
                            return console.log(err);
                        } else {

                            var payload = JSON.parse(body);
                            console.log(payload)
                            if (payload.ok) {
                                database.ref('installations/' + slackResponse.team_id).transaction(teamNode => {
                                    teamNode.name = payload.team.name;
                                    if (payload.enterprise_name) {
                                        teamNode.enterprise = payload.enterprise_name;
                                    }
                                    return teamNode;
                                });
                            } else {
                                console.log(payload.error);
                            }
                        }
                    });
                    return;
                }).catch(err => {
                    if (err) console.log(err);
                    // response.contentType('json').status(UNAUTHORIZED).send({
                    //     "Failure": "Failed to save data in the DB"
                    // });
                    response.redirect('http://xpertzsoftware.com?integration=failure');
                    return;
                });



            } else {
                console.log("Existing team!");
                response.redirect('http://xpertzsoftware.com?integration=alreadyinstalled');

                // response.contentType('json').status(UNAUTHORIZED).send({
                //     "Failure": "This team is already connected to Xpertz"
                // });
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            response.redirect('http://xpertzsoftware.com?integration=failure');
            // response.contentType('json').status(UNAUTHORIZED).send({
            //     "Failure": "Failed to check if this team is already connected"
            // });
            return;
        });
    }

};
