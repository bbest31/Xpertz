const firebase = require('firebase');
const util = require('./util');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  profileCommand: function (req, res) {
    var token = req.body.token;
    var user_name = req.body.user_name;
    var user_id = req.body.user_id;
    var team_id = req.body.team_id;
    var text = req.body.text;
    if (text) {
        var forSpecificUserId = text.substring(text.indexOf('<@') + 2, text.indexOf('|'));
        var forSpecificUserName = text.substring(text.indexOf('|') + 1, text.indexOf('>'));
        if (forSpecificUserId && forSpecificUserName) {
            user_id = forSpecificUserId;
            user_name = forSpecificUserName;
        }
    }

    //Validations
    if (util.validateToken(token, res)) {
        var attachments = [
            {
                "fallback": "User name's expertise",
                "text": "*" + user_name + "'s Expertise*",
                "color": "#2F80ED",
                "attachment_type": "default"
            }
        ];

        database.ref('users/' + team_id + '/' + user_id + '/tags').orderByChild('hi_five_count')
            .once("value").then(snapshot => {

                var tags = [];

                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    tags.push(childSnapshot.val());
                });

                if (tags.length > 0) {
                  console.log("BEFORE: ", tags);
                  tags.sort((tag1, tag2) => { return tag2.hi_five_count - tag1.hi_five_count });

                  console.log("AFTER: ", tags);
                  tags.forEach(tag => {
                      var hi_five_count = tag.hi_five_count;
                      var color = "#E0E0E0";

                      if (hi_five_count > 0 && hi_five_count <= 3) {
                          color = "#F2994A";
                      } else if (hi_five_count > 3 && hi_five_count <= 10) {
                          color = "#6989A7";
                      } else if (hi_five_count > 10) {
                          color = "#F2C94C";
                      }

                      attachments.push({
                          "fallback": "Expertise",
                          "fields": [
                              {
                                  "value": tag.tag,
                                  "short": true
                              },
                              {
                                  "value": "Hi fives: " + hi_five_count,
                                  "short": true
                              }
                          ],
                          "color": color,
                          "attachment_type": "default"
                      });
                  });
                }

                if (attachments.length > 1) {
                    res.contentType('json').status(200).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "attachments": attachments
                    });
                } else {
                    res.contentType('json').status(200).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "text": user_name + " doesn't have any expertise tags added yet :disappointed:"
                    });
                }
                return;
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });
    }
  }
};
