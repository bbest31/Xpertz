const functions = require('firebase-functions');
//var request = require("request");

//=========XPERTZ FUNCTIONS===========
/*
This file contains all the functions called from Slack using HTTPS.
*/

// exports.notifyNewSignup = functions.auth.user().onCreate( event =>{
//     const user = event.data;
//     const email = user.email;
//     return request.post(
//         "https://hooks.slack.com/services/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",
//         {json: {text: `New sign up from ${email} !!`}}
//     );
// });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//==========SLASH COMMAND FUNCTIONS==========

// Add Tag Command
exports.addTag = functions.https.onRequest((req, res) => {
    //Any validation of user origin


    res.contentType("json").status(200).send({
        "response_type": "ephemeral",
        "replace_original": true,
        "text": "*Add an expertise tag* :brain:",
        "attachments": [
            {
                "fallback": "Interactive menu to add a workspace tag or create a new one",
                "text": "Select a tag to add or create a new one!",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "tags_list",
                        "text": "Pick a tag...",
                        "type": "select",
                        "options": [
                            {
                                "text": "tag 1",
                                "value": "1"
                            },
                            {
                                "text": "tag 2",
                                "value": "2"
                            },
                            {
                                "text": "tag 3",
                                "value": "3"
                            },
                            {
                                "text": "tag 4",
                                "value": "4"
                            }
                        ]

                    },
                    {
                        "name": "add_tag_btn",
                        "text": "Add",
                        "type": "button",
                        "value": "add_tag",
                        "style": "primary"

                    },
                    {
                        "name": "create_tag_btn",
                        "text": "Create New",
                        "type": "button",
                        "value": "create_tag"

                    },
                    {
                        "name": "cancel_add_btn",
                        "text": "Cancel",
                        "type": "button",
                        "value": "cancel_add"

                    }

                ]
            }

        ]

    });

});

// Remove Tag Command
exports.removeTag = functions.https.onRequest((req, res) => {

    res.contentType("json").status(200).send({
        "response_type": "ephemeral",
        "replace_original": true,
        "text": "*Remove a tag* :x:",
        "attachments": [
            {
                "fallback": "Interactive menu to remove a tag from user profile",
                "text": "Choose a tag to remove",
                "color": "#F21111",
                "actions": [
                    {
                        "name": "my_tags_list",
                        "text": "Pick a tag...",
                        "type": "select",
                        "options": [
                            {
                                "text": "tag 1",
                                "value": "1"
                            },
                            {
                                "text": "tag 2",
                                "value": "2"
                            },
                            {
                                "text": "tag 3",
                                "value": "3"
                            },
                            {
                                "text": "tag 4",
                                "value": "4"
                            }
                        ]

                    },
                    {
                        "name": "remove_tag_btn",
                        "text": "Remove",
                        "type": "button",
                        "value": "remove_tag",
                        "style": "danger"
                    },
                    {
                        "name": "cancel_remove",
                        "text": "Cancel",
                        "type": "button",
                        "value": "cancel_remove",
                    }
                ]
            }
        ]
    });
});