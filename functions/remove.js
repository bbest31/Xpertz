const util = require('./util');
const firebase = require('firebase');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;
const INTERNAL_SERVER_ERROR = 500;

module.exports = {

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
    removeCommand: function (req, res) {
        this.sendRemoveTagMessage(res);
    },

    /**
     * 
     * @param {*} res 
     */
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

    /**
     * 
     * @param {*} payload 
     * @param {*} res
     */
    removeTagAction: function (payload, res) {
        const teamId = payload.team.id;
        const enterpriseId = payload.team.enterprise_id;
        const userId = payload.user.id;

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

                var correctValues = util.correctIdFromPayload(payload);
                var id = correctValues['id'];
                var idType = correctValues['id_type'];

                database.ref("organizations").orderByChild(idType).equalTo(id).once('value')
                    .then(orgSnapshot => {
                        if (orgSnapshot.val() && Object.keys(orgSnapshot.val())[0]) {
                            var orgId = Object.keys(orgSnapshot.val())[0];
                            // Find the correct user within the org and remove the tag
                            return database.ref('organizations/' + orgId + '/users/').orderByChild('third_party/slack_id').equalTo(userId).once('value')
                                .then(userSnapshot => {
                                    if (userSnapshot.val() && Object.keys(userSnapshot.val())[0]) {
                                        var userId = Object.keys(userSnapshot.val())[0];
                                        // Remove the tag
                                        var update = {};
                                        update[util.groomKeyToFirebase(tagToRemoveConfirm)] = null;
                                        return database.ref('organizations/' + orgId + '/users/' + userId + '/tags/').update(update,
                                            function (error) {
                                                // Callback function to decrement the tag user count for the org.
                                                if (error) {
                                                    console.error("removeTagAction|remove_btn_tag: ", error);
                                                } else {
                                                    var tagKey = util.groomKeyToFirebase(tagToRemoveConfirm);
                                                    database.ref('organizations/'+orgId+"tags/"+tagKey).transaction(post => {
                                                        if(post){
                                                            post.count--;
                                                        } else {
                                                            console.error("removeTagAction|remove_btn_tag: Could not decrement tag user count");
                                                        }
                                                        return post;
                                                    });
                                                }
                                            });
                                    } else {
                                        //Return an error msg that we couldn't locate the tag under that user.
                                        return res.contentType('json').status(INTERNAL_SERVER_ERROR).send();
                                    }
                                }).catch(err => {
                                    console.error("removeTagAction|remove_btn_tag: ", err);
                                });
                        }
                        // return a response that we couldn't locate that org.
                        return res.contentType('json').status(INTERNAL_SERVER_ERROR).send();
                    }).catch(err => {
                        console.error('removeTagAction|remove_btn_tag: ', err);
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
