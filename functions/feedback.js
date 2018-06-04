const firebase = require('firebase');
const util = require('./util');
const rp = require('request-promise');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  feedbackCommand: function (team_id, token, trigger_id, res) {
    util.retrieveAccessToken(team_id, token => {
        if (token) {
            let options = {
                method: "POST",
                uri: "https://slack.com/api/dialog.open",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + token
                },
                body: {
                    "trigger_id": trigger_id,
                    "dialog": {
                        "callback_id": "feedback_tag_dialog",
                        "title": "Feedback",
                        "submit_label": "Send",
                        "elements": [
                            {
                                "type": "textarea",
                                "label": "Feedback",
                                "name": "feedback"
                            }
                        ]
                    }
                },
                json: true
            }

            rp(options).
              then(response => {
                  res.status(OK).send();
                  return;
              }).
              catch(err => {
                  if (err) console.log(err);
                  res.status(OK).send();
                  return;
              });
          }
      });
  },

  feedbackSubmission: function(payload, res) {
      const feedbackText = payload.submission.feedback;
      const team_id = payload.team.id;
      const token = payload.token;

      database.ref('feedback').push().set(feedbackText).then(ref => {
        res.status(OK).send();
        util.retrieveAccessToken(team_id, token => {
            if (token) {
                let options = {
                    method: "POST",
                    uri: "https://slack.com/api/chat.postEphemeral",
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + token
                    },
                    body: {
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "text": "*Thank you for your feedback! We will thoroughly review it and execute on it* :raised_hands:",
                        "channel": payload.channel.id,
                        "user": payload.user.id,
                        "as_user": false,
                    },
                    json: true
                }

                util.makeRequestWithOptions(options);
            }
        });
        return;
      })
      .catch(err => {
        if (err) console.log(err);
      });
  }

};
