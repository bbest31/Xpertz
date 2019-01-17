const firebase = require('firebase');
const util = require('./util_dev');
const rp = require('request-promise');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  feedbackCommand: function (teamID, triggerID, res) {
    util.retrieveAccessToken(teamID, token => {
        if (token) {
            let options = {
                method: 'POST',
                uri: 'https://slack.com/api/dialog.open',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + token
                },
                body: {
                    'trigger_id': triggerID,
                    'dialog': {
                        'callback_id': 'feedback_tag_dialog',
                        'title': 'Feedback',
                        'submit_label': 'Send',
                        'elements': [
                            {
                                'type': 'textarea',
                                'label': 'Feedback',
                                'name': 'feedback'
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
      const teamID = payload.team.id;
      const userID = payload.user.id;
      const username = payload.user.name;
      const token = payload.token;
      const enterpriseID = payload.team.enterprise_id;

      var ref = 'feedback/';
      if (enterpriseID) {
         ref += enterpriseID + '/';
      }
      ref += teamID;

      database.ref(ref).push().set({
        'feedback': feedbackText,
        'user_id': userID,
        'username': username,
        'date': new Date()
      }).then(ref => {
        res.status(OK).send();
        util.retrieveAccessToken(teamID, token => {
            if (token) {
                let options = {
                    method: 'POST',
                    uri: payload.response_url,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                    body: {
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Thank you for your feedback! We will thoroughly review it and execute on it* :raised_hands:',
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
