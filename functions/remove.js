const util = require('./util');
const firebase = require('firebase');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', {https: true});

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  removeCommand: function (req, res) {
    this.sendRemoveTagMessage(res);
  },

  sendRemoveTagMessage: function (res) {
      res.contentType('json').status(OK).send({
          'response_type': 'ephemeral',
          'replace_original': true,
          'text': '*Remove a tag* :x:',
          'attachments': [
              {
                  'fallback': 'Interactive menu to remove a tag from user profile',
                  'text': 'Choose a tag to remove',
                  'callback_id': 'remove_tag',
                  'color': '#F21111',
                  'actions': [
                      {
                          'name': 'user_tags_menu_button',
                          'text': 'Pick a tag...',
                          'type': 'select',
                          'data_source': 'external',

                      },
                      {
                          'name': 'cancel_remove',
                          'text': 'Cancel',
                          'type': 'button',
                          'value': 'cancel',
                      }
                  ]
              }
          ]
      });
  },

  removeTagAction: function(payload, res) {
    const teamID = payload.team.id;
    const enterpriseID = payload.team.enterprise_id;
    const userID = payload.user.id;

    switch (payload.actions[0]['name']) {
        case 'user_tags_menu_button':
            visitor.event('Actions', 'Remove Team Tags Menu Selection action').send();
            // Update menu button to have selection as the selected item.
            var tagToRemove = payload.actions[0].selected_options[0].value;
            res.contentType('json').status(OK).send({
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': '*Remove a tag* :x:',
                'attachments': [
                    {
                        'fallback': 'Interactive menu to remove a tag from user profile',
                        'text': 'Choose a tag to remove',
                        'callback_id': 'remove_tag',
                        'color': '#F21111',
                        'actions': [
                            {
                                'name': 'user_tags_menu_button',
                                'text': 'Pick a tag...',
                                'type': 'select',
                                'min_query_length': 1,
                                'data_source': 'external',
                                'selected_options': [
                                    {
                                        'text': tagToRemove,
                                        'value': tagToRemove
                                    }
                                ]

                            },
                            {
                                'name': 'remove_tag_btn',
                                'text': 'Remove',
                                'type': 'button',
                                'value': tagToRemove,
                                'style': 'danger',
                                'confirm': {
                                    'title': 'Are you sure?',
                                    'text': 'Removing this tag will remove all of its high-fives. Do you still want to?',
                                    'ok_text': 'Yes',
                                    'dismiss_text': 'No'
                                }
                            },
                            {
                                'name': 'cancel_remove',
                                'text': 'Cancel',
                                'type': 'button',
                                'value': 'cancel',
                            }
                        ]
                    }
                ]
            });
            break;
        case 'remove_tag_btn':
            visitor.event('Actions', 'Remove Tag action').send();

            //Remove the tag node from the user and decrement workplace count of that tag.
            var tagToRemoveConfirm = payload.actions[0]['value'];

            var id = '';
            if (enterpriseID) {
              id = enterpriseID;
            } else {
              id = teamID;
            }
            database.ref('workspaces').orderByChild('team').equalTo(id).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var workspaceId = Object.keys(snapshot.val())[0];
                    return database.ref('workspaces/'+workspaceId+'/users/').orderByChild('user_id').equalTo(userID).once('value')
                    .then(userSnapshot => {
                        if (userSnapshot.val() && Object.keys(userSnapshot.val())[0]) {
                          var userId = Object.keys(userSnapshot.val())[0];
                          return database.ref('workspaces/'+workspaceId+'/users/'+userId+'/tags/').orderByChild('tag').equalTo(tagToRemoveConfirm).once('value')
                          .then(tagsSnapshot => {
                              if (tagsSnapshot.val() && Object.values(tagsSnapshot.val())[0]){
                                  return database.ref('tags').orderByChild('team').equalTo(id).once('value')
                                  .then(teamSnapshot => {
                                      if (teamSnapshot.val() && Object.keys(teamSnapshot.val())[0]) {
                                          var workspaceId = Object.keys(teamSnapshot.val())[0];
                                          return database.ref('tags/'+workspaceId+'/tags').orderByChild('tag_title').equalTo(tagToRemoveConfirm).once('value')
                                          .then(tagSnapshot => {
                                              if (tagSnapshot.val() && Object.keys(tagSnapshot.val())[0]) {
                                                  var tagIdInUsers = Object.values(tagsSnapshot.val())[0];
                                                  var tagIdInTags = Object.keys(tagSnapshot.val())[0];
                                                  database.ref('workspaces/'+workspaceId+'/users/'+userId+'/tags/'+tagIdInUsers).remove();
                                                  database.ref('tags/'+workspaceId+'/tags'+tagIdInTags).transaction(tagValue => {
                                                      if (tagValue) {
                                                          if (tagValue.count > 0) {
                                                              tagValue.count--;
                                                          } else {
                                                              tagValue.count = 0;
                                                          }
                                                      } else {
                                                          tagValue = {
                                                              'tag_title': tagToRemoveConfirm,
                                                              'tag_code': tagToRemoveConfirm.toLowerCase(),
                                                              'count': 0
                                                          };
                                                      }
                                                      return tagValue;
                                                  });
                                              } else {
                                                  throw new Error;
                                              }
                                          })
                                          .catch(err => {
                                              if (err) console.log(err);
                                              return;
                                          });
                                      } else {
                                          throw new Error;
                                      }
                                  })
                                  .catch(err => {
                                      if (err) console.log(err);
                                      return;
                                  });
                              } else {
                                  throw new Error;
                              }
                          })
                          .catch(err => {
                            if (err) console.log(err);
                            return;
                          });
                        } else {
                            throw new Error;
                        }
                    })
                    .catch(err => {
                        if (err) console.log(err);
                        return;
                    });
                } else {
                    throw new Error;
                }
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });

            database.ref('workspaces').orderByChild('team').equalTo(id).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var workspaceId = Object.keys(snapshot.val())[0];
                    return database.ref('workspaces/'+workspaceId+'/tags/').orderByChild('tag').equalTo(tagToRemoveConfirm).once('value')
                    .then(tagSnapshot => {
                        if (tagSnapshot.val() && Object.keys(tagSnapshot.val())[0]) {
                            var tagId = Object.keys(tagSnapshot.val())[0];
                            return database.ref('workspaces/'+workspaceId+'/tags/'+tagId+'/users/').orderByChild('user_id').equalTo(userID).remove();
                        } else {
                            throw new Error;
                        }
                    })
                    .catch(err => {
                        if (err) console.log(err);
                        return;
                    });
                } else {
                    throw new Error;
                }
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });

            res.contentType('json').status(OK).send({
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': '*Expertise tag was succesfully removed* :x:',
                'attachments': [
                    {
                        'fallback': 'Confirmation that tag was successfully removed',
                        'callback_id': 'remove_more_tags',
                        'text': 'Tag: ' + tagToRemoveConfirm + ' has been successfully removed from your profile',
                        'color': '#F21111',
                        'attachment_type': 'default',
                        'actions': [
                            {
                                'name': 'remove_more_tags_button',
                                'text': 'Remove More Tags',
                                'type': 'button',
                                'value': 'remove_more',
                                'style': 'danger'
                            },
                            {
                                'name': 'cancel',
                                'text': 'Finish',
                                'type': 'button',
                                'value': 'cancel'
                            }
                        ]
                    }
                ]
            });
            break;
    }
  }
};
