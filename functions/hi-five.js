const firebase = require('firebase');
const util = require('./util');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', {https: true});

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  hiFiveCommand: function (req, res) {
      var token = req.body.token;
      var text = req.body.text;

      if (util.validateToken(token, res)) {
          if (!text) {
              res.contentType('json').status(OK).send({
                  "text": "_Must provide a mentioned user!_"
              });
            } else {
              var userId = text.substring(text.indexOf('<@') + 2, text.indexOf('|'));
              var userName = text.substring(text.indexOf('|') + 1, text.indexOf('>'));
              if (userId && userName) {
                  if (userId === req.body.user_id) {
                      res.contentType('json').status(OK).send({
                          "text": "_You can't hi-five yourself!_"
                      });
                  } else {
                      this.sendHiFiveMessage(res, userName, userId, req.body.team_id);
                  }
              } else {
                  res.contentType('json').status(OK).send({
                      "text": "_Must provide a mentioned user!_"
                  });
              }
          }
      }
  },

  /**
   * Not being used at the moment
   * @param {*} res
   */
  sendHiFiveInitialMessage: function (res) {
      res.contentType("json").status(OK).send({
          "response_type": "ephemeral",
          "replace_original": true,
          "text": "*Give someone a hi-five for helping!* :clap:",
          "attachments": [
              {
                  "fallback": "Select a user that helped you out with your issue.",
                  "callback_id": "h5",
                  "text": "Choose the colleague that helped you",
                  "color": "#3AA3E3",
                  "attachment_type": "default",
                  "actions": [
                      {
                          "name": "pick_user_menu_button",
                          "text": "Choose colleague",
                          "type": "select",
                          "data_source": "users",
                      },
                      {
                          "name": "cancel_h5_button",
                          "text": "Cancel",
                          "value": "cancel",
                          "type": "button"
                      }

                  ]
              }
          ]
      });
  },

  /**
   * This function responds to start the hi_five workflow.
   * @param {Express.Response} res
   * @param {string} user_name
   * @param {string} user_id
   */
  sendHiFiveMessage: function (res, user_name, user_id, team_id) {
      database.ref('workspaces/' + team_id + '/users/' + user_id + '/tags')
          .once("value").then(snapshot => {

              var options = {
                  options: []
              };
              // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
              snapshot.forEach(childSnapshot => {
                  options.options.push({
                      "text": childSnapshot.key,
                      "value": childSnapshot.key + '|' + user_name + '|' + user_id
                  });
              });

              return res.contentType("json").status(OK).send({
                  "response_type": "ephemeral",
                  "replace_original": true,
                  "text": "*Choose one of " + user_name + "'s expertise to hi_five!* :clap:",
                  "attachments": [
                      {
                          "fallback": "Select one of their expertise they used to help you out",
                          "callback_id": "h5",
                          "text": "Choose the expertise they used to help",
                          "color": "#20BA42",
                          "attachment_type": "default",
                          "actions": [
                              {
                                  "name": "h5_tag_menu_button",
                                  "text": "Choose expertise",
                                  "type": "select",
                                  "options": options.options,
                              },
                              {
                                  "name": "cancel_h5_button",
                                  "text": "Cancel",
                                  "value": "cancel",
                                  "type": "button"
                              }

                          ]
                      }
                  ]
              });
          })
          .catch(err => {
              if (err) console.log(err);
              return;
          });

  },

  sendHiFiveSelectedTagMessage: function (res, selectedOption, team_id) {
      var user_id = selectedOption.substring(selectedOption.lastIndexOf('|') + 1);
      var user_name = selectedOption.substring(selectedOption.indexOf('|') + 1, selectedOption.lastIndexOf('|'));
      var selectedTag = selectedOption.substring(0, selectedOption.indexOf('|'));

      database.ref('workspaces/' + team_id + '/users/' + user_id + '/tags')
          .once("value").then(snapshot => {

              var options = {
                  options: []
              };
              // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
              snapshot.forEach(childSnapshot => {
                  options.options.push({
                      "text": childSnapshot.key,
                      "value": childSnapshot.key + '|' + user_name + '|' + user_id
                  });
              });

              return res.contentType("json").status(OK).send({
                  "response_type": "ephemeral",
                  "replace_original": true,
                  "text": "*Choose one of " + user_name + "'s expertise to hi_five!* :clap:",
                  "attachments": [
                      {
                          "fallback": "Select one of their expertise they used to help you out",
                          "callback_id": "h5",
                          "text": "Choose the expertise they used to help",
                          "color": "#20BA42",
                          "attachment_type": "default",
                          "actions": [
                              {
                                  "name": "h5_tag_menu_button",
                                  "text": "Choose expertise",
                                  "type": "select",
                                  "options": options.options,
                                  "selected_options": [
                                      {
                                          "text": selectedTag,
                                          "value": selectedOption
                                      }
                                  ]
                              },
                              {
                                  "name": "h5_button",
                                  "type": "button",
                                  "text": "Hi-Five!",
                                  "value": selectedOption,
                                  "style": "primary"
                              },
                              {
                                  "name": "cancel_h5_button",
                                  "text": "Cancel",
                                  "value": "cancel",
                                  "type": "button"
                              }

                          ]
                      }
                  ]
              });
          })
          .catch(err => {
              if (err) console.log(err);
              return;
          });
  },

  hiFiveAction: function(payload, res) {
    const team_id = payload.team.id;

    switch (payload.actions[0]["name"]) {

        case "h5_tag_menu_button":
            visitor.event("Actions", "Hi_Five Tags Menu Selection action").send();
            var selectedOption = payload.actions[0].selected_options[0].value;
            this.sendHiFiveSelectedTagMessage(res, selectedOption, team_id);
            break;

        case "h5_button":
            visitor.event("Actions", "Hi_Five action").send();

            var optionValue = payload.actions[0]["value"];
            var colleague_name = optionValue.substring(optionValue.indexOf('|') + 1, optionValue.lastIndexOf('|'));
            var colleague_id = optionValue.substring(optionValue.lastIndexOf('|') + 1);
            var colleague_tag = optionValue.substring(0, optionValue.indexOf('|'));

            // Increment the hi_five count
            database.ref('workspaces/' + team_id + '/users/' + colleague_id + '/tags/' + colleague_tag).once('value')
                .then(snapshot => {
                    if (snapshot.val()) {
                        database.ref('workspaces/' + team_id + '/users/' + colleague_id + '/tags/' + colleague_tag).transaction(tagNode => {
                            if (tagNode) {
                                tagNode.hi_five_count++;
                            }
                            return tagNode;
                        });
                    } else {
                        throw new Error;
                    }
                    return;
                }).catch(err => {
                    if (err) console.log(err)
                    res.contentType('json').status(OK).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "text": "Oops! Something went wrong on our side :confused: Try again..."
                    });
                    return;
                });

                database.ref('workspaces/' + team_id + '/tags/' + colleague_tag + '/users/' + colleague_id).once('value')
                    .then(snapshot => {
                        if (snapshot.val()) {
                            database.ref('workspaces/' + team_id + '/tags/' + colleague_tag + '/users/' + colleague_id).transaction(tagNode => {
                                if (tagNode) {
                                    tagNode.hi_five_count++;
                                }
                                return tagNode;
                            });
                        } else {
                            throw new Error;
                        }
                        return;
                    }).catch(err => {
                        if (err) console.log(err)
                        res.contentType('json').status(OK).send({
                            "response_type": "ephemeral",
                            "replace_original": true,
                            "text": "Oops! Something went wrong on our side :confused: Try again..."
                        });
                        return;
                    });

            // Confirmation response
            res.contentType('json').status(OK).send({
                "response_type": "ephemeral",
                "replace_original": true,
                "attachments": [
                    {
                        "fallback": "Confirmation that the hi-five was successfully given",
                        "callback_id": "h5",
                        "text": "*You gave " + colleague_name + " a hi-five towards their " + colleague_tag + " expertise* :+1: :tada:",
                        "color": "#20BA42",
                        "attachment_type": "default",
                    }
                ]
            });
            break;
    }
  }
};
