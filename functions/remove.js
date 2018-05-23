const util = require('./util');
const firebase = require('firebase');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  removeCommand: function (req, res) {
    var token = req.body.token;

    //Validations
    if (util.validateToken(token, res)) {
        module.exports.sendRemoveTagMessage(res);
    }
  },

  sendRemoveTagMessage: function (res) {
      res.contentType("json").status(OK).send({
          "response_type": "ephemeral",
          "replace_original": true,
          "text": "*Remove a tag* :x:",
          "attachments": [
              {
                  "fallback": "Interactive menu to remove a tag from user profile",
                  "text": "Choose a tag to remove",
                  "callback_id": "remove_tag",
                  "color": "#F21111",
                  "actions": [
                      {
                          "name": "user_tags_menu_button",
                          "text": "Pick a tag...",
                          "type": "select",
                          "data_source": "external",

                      },
                      {
                          "name": "cancel_remove",
                          "text": "Cancel",
                          "type": "button",
                          "value": "cancel",
                      }
                  ]
              }
          ]
      });
  },

  removeTagAction: function(payload, res) {
    const team_id = payload.team.id;
    const user_id = payload.user.id;

    switch (payload.actions[0]["name"]) {
        case "user_tags_menu_button":
            // Update menu button to have selection as the selected item.
            var tagToRemove = payload.actions[0].selected_options[0].value;
            res.contentType('json').status(OK).send({
                "response_type": "ephemeral",
                "replace_original": true,
                "text": "*Remove a tag* :x:",
                "attachments": [
                    {
                        "fallback": "Interactive menu to remove a tag from user profile",
                        "text": "Choose a tag to remove",
                        "callback_id": "remove_tag",
                        "color": "#F21111",
                        "actions": [
                            {
                                "name": "user_tags_menu_button",
                                "text": "Pick a tag...",
                                "type": "select",
                                "min_query_length": 1,
                                "data_source": "external",
                                "selected_options": [
                                    {
                                        "text": tagToRemove,
                                        "value": tagToRemove
                                    }
                                ]

                            },
                            {
                                "name": "remove_tag_btn",
                                "text": "Remove",
                                "type": "button",
                                "value": tagToRemove,
                                "style": "danger",
                                "confirm": {
                                    "title": "Are you sure?",
                                    "text": "Removing this tag will remove all of its hi-fives. Do you still want to?",
                                    "ok_text": "Yes",
                                    "dismiss_text": "No"
                                }
                            },
                            {
                                "name": "cancel_remove",
                                "text": "Cancel",
                                "type": "button",
                                "value": "cancel",
                            }
                        ]
                    }
                ]
            });
            break;
        case "remove_tag_btn":
            //Remove the tag node from the user and decrement workplace count of that tag.
            var tagToRemoveConfirm = payload.actions[0]["value"];

            database.ref('users/' + team_id + '/' + user_id + '/tags/' + tagToRemoveConfirm).once('value')
                .then(snapshot => {
                    console.log("snapshot: ", snapshot);
                    if (snapshot.val()) {
                        database.ref('users/' + team_id + '/' + user_id + '/tags/' + tagToRemoveConfirm).remove();
                        database.ref('tags/' + team_id + '/' + tagToRemoveConfirm).transaction(tagValue => {
                            if (tagValue) {
                                if (tagValue.count > 0) {
                                    tagValue.count--;
                                } else {
                                    tagValue.count = 0;
                                }
                            } else {
                                tagValue = {
                                    "tag_title": tagToRemoveConfirm,
                                    "tag_code": tagToRemoveConfirm.toLowerCase(),
                                    "count": 0
                                };
                            }
                            return tagValue;
                        });
                    }
                    return;
                })
                .catch(err => {
                    if (err) console.log(err);
                    return;
                });

            res.contentType('json').status(OK).send({
                "response_type": "ephemeral",
                "replace_original": true,
                "text": "*Expertise tag was succesfully removed* :cry:",
                "attachments": [
                    {
                        "fallback": "Confirmation that tag was successfully removed",
                        "callback_id": "remove_more_tags",
                        "text": "Tag: " + tagToRemoveConfirm + " has been successfully removed from your profile",
                        "color": "#F21111",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "remove_more_tags_button",
                                "text": "Remove More Tags",
                                "type": "button",
                                "value": "remove_more",
                                "style": "danger"
                            },
                            {
                                "name": "cancel",
                                "text": "Finish",
                                "type": "button",
                                "value": "cancel"
                            }
                        ]
                    }
                ]
            });
            break;
    }
  }
};
