const util = require('./util');
const rp = require('request-promise');
const firebase = require('firebase');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', {https: true});

// Get a reference to the database service
const database = firebase.database();

const OK = 200;

const MAX_TAGS = 15;
const MAX_USERS = 15;

module.exports = {

  /**Add Tag Command
   * This function will initiate the add expertise tag workflow to the user if they are validated.
   *
   * Example Response Body
   *
   * body:  { token: 'th15i5AnAc355T0K3N',
    team_id: 'ABCDEFGHI',
    team_domain: 'xpertzdev',
    channel_id: 'CAAFC3RDJ',
    channel_name: 'general',
    user_id: 'UAJKE3ULE',
    user_name: 'bakurov.illya',
    command: '/add',
    text: '',
    response_url: 'https://hooks.slack.com/commands/ABCDEFGHI/359350492293/th15i5AnAc355T0K3N',
    trigger_id: '359113754147.350752158706.334e59ad4556e82cbea59be1f7b0b70f' }
   */
  addCommand: function (req, res) {
      var token = req.body.token;
      var user_id = req.body.user_id;
      var team_id = req.body.team_id;

      this.checkAndFireAddCommandIsAvailable(team_id, user_id, token, res);
  },

  checkAndFireAddCommandIsAvailable: function(team_id, user_id, token, res) {
      //Validations
      if (util.validateToken(token, res)) {
        database.ref('workspaces/' + team_id + '/users/' + user_id + '/tags').once('value')
          .then(snapshot => {
              if (!snapshot.val() || (snapshot.val() && Object.keys(snapshot.val()).length < MAX_TAGS)) {
                this.sendAddOrCreateTagMessage(res);
              } else {
                res.contentType('json').status(OK).send({
                    "response_type": "ephemeral",
                    "replace_original": true,
                    "text": "*Max number of expertise tags already reached!*"
                  });
              }
              return;
            })
          .catch(err => {
            if (err) console.log(err);
            this.sendAddOrCreateTagMessage(res);
          });
      }
  },

  sendAddOrCreateTagMessage: function (res) {
    res.contentType('json').status(OK).send({
        "response_type": "ephemeral",
        "replace_original": true,
        "text": "*Add an expertise tag* :brain:",
        "attachments": [
            {
                "fallback": "Interactive menu to add a workspace tag or create a new one",
                "callback_id": "add_tag",
                "text": "Select a tag to add or create a new one! *(max. " + MAX_TAGS + ")*",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "team_tags_menu_button",
                        "text": "Pick a tag...",
                        "type": "select",
                        "data_source": "external",
                        "min_query_length": 1,
                    },
                    {
                        "name": "create_tag_button",
                        "text": "Create New",
                        "type": "button",
                        "value": "create"
                    },
                    {
                        "name": "cancel_add_button",
                        "text": "Cancel",
                        "type": "button",
                        "value": "cancel"
                    }
                ]
            }
        ]
    });
  },

  openDialogToAddNewTag: function (team_id, trigger_id, success) {
      util.retrieveAccessToken(team_id, token => {
          if (!token) {
              success(false);
          } else {
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
                          "callback_id": "add_new_tag_dialog",
                          "title": "Create New Tag",
                          "submit_label": "Create",
                          "notify_on_cancel": true,
                          "elements": [
                              {
                                  "type": "text",
                                  "label": "Tag Title",
                                  "name": "tag_title",
                                  "placeholder": "Enter tag title",
                                  "hint": "Consult your policy team on tag creation and check already in use tags with the /tags command"
                              },
                              {
                                  "type": "textarea",
                                  "label": "Description",
                                  "name": "description",
                                  "max_length": 140,
                                  "min_length": 10,
                                  "hint": "Please, notice that creation of a new tag doesn't add it to your profile. You need to add tag after you have created it."
                              }
                          ]
                      }
                  },
                  json: true
              }

              rp(options).
                  then(response => {
                      if (success) success(true);
                      return;
                  }).
                  catch(err => {
                      if (err) console.log(err);
                      if (success) success(false);
                      return;
                  });
          }
      });
  },

  failedToCreateTag: function (token, channel_id, user_id, reason) {
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
              "text": "*Add an expertise tag* :brain:",
              "channel": channel_id,
              "user": user_id,
              "as_user": false,
              "attachments": [
                  {
                      "fallback": "Confirmation of failed tag addition",
                      "callback_id": "create_new_tag_failure",
                      "text": reason,
                      "color": "#F21111",
                      "attachment_type": "default",
                  },
                  {
                      "fallback": "Interactive menu to add a workspace tag or create a new one",
                      "callback_id": "add_tag",
                      "text": "Select a tag to add or create a new one! *(max. " + MAX_TAGS + ")*",
                      "color": "#3AA3E3",
                      "attachment_type": "default",
                      "actions": [
                          {
                              "name": "team_tags_menu_button",
                              "text": "Pick a tag...",
                              "type": "select",
                              "data_source": "external",
                              "min_query_length": 1
                          },
                          {
                              "name": "create_tag_button",
                              "text": "Create New",
                              "type": "button",
                              "value": "create"
                          },
                          {
                              "name": "cancel_add_button",
                              "text": "Cancel",
                              "type": "button",
                              "value": "cancel"
                          }
                      ]
                  }
              ]
          },
          json: true
      }

      util.makeRequestWithOptions(options);
  },

  addNewTagDialog: function (payload, res) {
    const token = payload.token;
    const team_id = payload.team.id;
    const tag_title = payload.submission.tag_title;
    const description = payload.submission.description;
    const tag_code = tag_title.toLowerCase();

    database.ref('tags/' + team_id + '/' + tag_title).once('value').then(snapshot => {
        if (!snapshot.val()) {
            database.ref('tags/' + team_id + "/" + tag_title).set({
                tag_title,
                tag_code,
                description,
                count: 0
            }).then(ref => {
                //Success!!!
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
                                "text": "*Expertise tag was successfully added* :raised_hands:",
                                "channel": payload.channel.id,
                                "user": payload.user.id,
                                "as_user": false,
                                "attachments": [
                                    {
                                        "fallback": "Confirmation of successful tag addition",
                                        "callback_id": "create_new_tag_success",
                                        "text": "Tag has been created successfully",
                                        "color": "#00D68F",
                                        "attachment_type": "default",
                                    },
                                    {
                                        "fallback": "Interactive menu to add a workspace tag or create a new one",
                                        "callback_id": "add_tag",
                                        "text": "Select a tag to add or create a new one! *(max. " + MAX_TAGS + ")*",
                                        "color": "#3AA3E3",
                                        "attachment_type": "default",
                                        "actions": [
                                            {
                                                "name": "team_tags_menu_button",
                                                "text": "Pick a tag...",
                                                "type": "select",
                                                "data_source": "external",
                                                "min_query_length": 1
                                            },
                                            {
                                                "name": "create_tag_button",
                                                "text": "Create New",
                                                "type": "button",
                                                "value": "create"
                                            },
                                            {
                                                "name": "cancel_add_button",
                                                "text": "Cancel",
                                                "type": "button",
                                                "value": "cancel"
                                            }
                                        ]
                                    }
                                ]
                            },
                            json: true
                        }

                        util.makeRequestWithOptions(options);
                    }
                });
                return;
            }).catch(err => {
                if (err) console.log(err);
                res.status(OK).send();
                util.retrieveAccessToken(team_id, token => {
                    if (token) {
                        this.failedToCreateTag(token, payload.channel.id, payload.user.id, "Tag has failed to be created");
                    }
                });
                return;
            });
        } else {
            res.status(OK).send();
            util.retrieveAccessToken(team_id, token => {
                if (token) {
                    this.failedToCreateTag(token, payload.channel.id, payload.user.id, "Tag already exists");
                }
            });
        }
        return;
    }).catch(err => {
        if (err) console.log(err);
        res.status(OK).send();
        util.retrieveAccessToken(team_id, token => {
            if (token) {
                this.failedToCreateTag(token, payload.channel.id, payload.user.id, "Tag has failed to be created");
            }
        });
        return;
    });
  },

  dialogCancellation: function(payload, res) {
    const token = payload.token;
    const team_id = payload.team.id;

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
                    "text": "*Add an expertise tag* :brain:",
                    "channel": payload.channel.id,
                    "user": payload.user.id,
                    "as_user": false,
                    "attachments": [
                        {
                            "fallback": "Interactive menu to add a workspace tag or create a new one",
                            "callback_id": "add_tag",
                            "text": "Select a tag to add or create a new one! *(max. " + MAX_TAGS + ")*",
                            "color": "#3AA3E3",
                            "attachment_type": "default",
                            "actions": [
                                {
                                    "name": "team_tags_menu_button",
                                    "text": "Pick a tag...",
                                    "type": "select",
                                    "data_source": "external",
                                    "min_query_length": 1
                                },
                                {
                                    "name": "create_tag_button",
                                    "text": "Create New",
                                    "type": "button",
                                    "value": "create"
                                },
                                {
                                    "name": "cancel_add_button",
                                    "text": "Cancel",
                                    "type": "button",
                                    "value": "cancel"
                                }
                            ]
                        }
                    ]
                },
                json: true
            }

            util.makeRequestWithOptions(options);
        }
    });
  },

  addTagAction: function (payload, res) {
    const response_url = payload.response_url;
    const team_id = payload.team.id;
    const user_id = payload.user.id;
    const username = payload.user.name;
    const trigger_id = payload.trigger_id;

    //Handle button response from add tag workflow
    switch (payload.actions[0]["name"]) {
        case "create_tag_button":
            util.cancelButtonIsPressed(response_url, success => {
                this.openDialogToAddNewTag(team_id, trigger_id, success => {
                    res.status(OK).send();
                    return;
                });
                return;
            });
            break;
        case "team_tags_menu_button":
            visitor.event("Actions", "Add Team Tags Menu Selection action").send();
            // This was a menu selection for adding a tag
            var tagToAdd = payload.actions[0].selected_options[0].value;
            res.contentType('json').status(OK).send({
                "response_type": "ephemeral",
                "replace_original": true,
                "text": "*Add an expertise tag* :brain:",
                "attachments": [
                    {
                        "fallback": "Interactive menu to add a workspace tag or create a new one",
                        "callback_id": "add_tag",
                        "text": "Select a tag to add or create a new one! *(max. " + MAX_TAGS + ")*",
                        "color": "#3AA3E3",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "team_tags_menu_button",
                                "text": "Pick a tag...",
                                "type": "select",
                                "data_source": "external",
                                "min_query_length": 1,
                                "selected_options": [
                                    {
                                        "text": tagToAdd,
                                        "value": tagToAdd
                                    }
                                ]
                            },
                            {
                                "name": "add_tag_confirm_button",
                                "text": "Add",
                                "type": "button",
                                "value": tagToAdd,
                                "style": "primary"
                            },
                            {
                                "name": "create_tag_button",
                                "text": "Create New",
                                "type": "button",
                                "value": "create"
                            },
                            {
                                "name": "cancel_add_button",
                                "text": "Cancel",
                                "type": "button",
                                "value": "cancel"
                            }
                        ]
                    }
                ]
            });
            break;
        case "add_tag_confirm_button":
            visitor.event("Actions", "Add Tag action").send();

            database.ref('workspaces/' + team_id + '/users').once('value')
              .then(snapshot => {
                  if (!snapshot.val() || (snapshot.val() && Object.keys(snapshot.val()).length < MAX_USERS)) {
                    this.addTagConfirm(team_id, user_id, username, payload, res);
                  } else {
                    res.contentType('json').status(OK).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "text": "*Looks like your team only has the free tier of Xpertz which only supports the first " + MAX_USERS + " members to add tags. Consult your manager/supervisor about upgrading to support more or contact us at <email or website link>*"
                      });
                  }
                  return;
                })
              .catch(err => {
                if (err) console.log(err);
                this.addTagConfirm(team_id, user_id, username, payload, res);
              });
            break;
    }
  },

  addTagConfirm: function(team_id, user_id, username, payload, res) {
    var tagToAddConfirm = payload.actions[0]["value"];

    database.ref('workspaces/' + team_id + '/users/' + user_id + '/tags/' + tagToAddConfirm).once('value')
        .then(snapshot => {
            if (!snapshot.val()) {
                database.ref('workspaces/' + team_id + '/users/' + user_id + '/tags/' + tagToAddConfirm).set({
                    "tag": tagToAddConfirm,
                    "hi_five_count": 0
                }).then(snap => {
                    database.ref('tags/' + team_id + '/' + tagToAddConfirm).transaction(tagValue => {
                        if (tagValue) {
                            tagValue.count++;
                        } else {
                            tagValue = {
                                "tag_title": tagToAddConfirm,
                                "tag_code": tagToAddConfirm.toLowerCase(),
                                "count": 1
                            };
                        }
                        return tagValue;
                    });
                    return;
                }).catch(err => {
                    if (err) console.log(err);
                    return;
                });
            }
            return;
        })
        .catch(err => {
            if (err) console.log(err);
            return;
        });

    database.ref('workspaces/' + team_id + '/tags/' + tagToAddConfirm + '/users/' + user_id).once('value')
        .then(snapshot => {
            if (!snapshot.val()) {
                database.ref('workspaces/' + team_id + '/tags/' + tagToAddConfirm + '/users/' + user_id).set({
                    "user_id": user_id,
                    "username": username,
                    "hi_five_count": 0
                }).catch(err => {
                    if (err) console.log(err);
                    return;
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
        "text": "*Expertise tag was succesfully added* :raised_hands:",
        "attachments": [
            {
                "fallback": "Confirmation that tag was successfully added",
                "callback_id": "add_more_tags",
                "text": "Tag: " + tagToAddConfirm + " has been successfully added to your profile",
                "color": "#00D68F",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "add_more_tags_button",
                        "text": "Add More Tags",
                        "type": "button",
                        "value": "add_more",
                        "style": "primary"
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
  }

};
