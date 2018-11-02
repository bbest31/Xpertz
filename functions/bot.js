const request = require('request');
const firebase = require('firebase');
const util = require('./util');
// Get a reference to the database service
var database = firebase.database();

// Actions executed by our Bot user.
module.exports = {
    // Onboarding msg dm'd to a user that joins the workspace triggered by the team_join event type
    onboardMsg: function (user,team_id, res) {

        var token = undefined;
        database.ref('installations/'+ team_id + '/token').once("value").then(snapshot =>{
            token = snapshot.val();
        });

        //Get DM id
        request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + user.user_id, (err, res, body) => {
            if (err) {
                return console.log(err);
            } else {

                let payload = JSON.parse(body);
                let dm_id = payload.channel.id;
                var msg = "*Welcome to the team* <@" + user.user_id + ">! Let's show your new colleagues what skills you bring to the team using Xpertz. You can start by using the `/helper` command to get started.";

                //Send DM to user
                request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dm_id + '&text=' + msg, (error, res, body) => {
                    if (error) {
                        return console.log(error);
                    } else {
                        // Success when new user joins
                        // console.log(res);
                        return;
                    }
                });
            }
        });
        res.contentType('json').status(OK).send();
        return;
    },

    // Sends a DM to the user by the bot notifying them one of their skills ranked up.
    tagRankUp: async function (id, team_id) {

        var token = undefined;
        database.ref('installations/'+ team_id + '/token').once("value").then(snapshot =>{
            token = snapshot.val();
        });

        //Get DM id
        request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + id, (err, res, body) => {
            if (err) {
                return console.log(err);
            } else {

                let payload = JSON.parse(body);
                let dm_id = payload.channel.id;
                var msg = "*Congratulations* <@" + id + "> *your <tag_name> expertise has ranked up!*";

                //Send DM to user
                request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dm_id + '&text=' + msg, (error, res, body) => {
                    if (error) {
                        return console.log(error);
                    } else {
                        // Success when new user joins
                        // console.log(res);
                        return;
                    }
                });
            }
        });
        return;
    },

    // Unsure if we will use this
    tagRecommendation: async function (id, sender_id, skill) {

        var id = user.team_id;
        var token = undefined;
        database.ref('installations/'+ id + '/token').once("value").then(snapshot =>{
            token = snapshot.val();
        });

        //Get DM id
        request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + id, (err, res, body) => {
            if (err) {
                return console.log(err);
            } else {

                let payload = JSON.parse(body);
                let dm_id = payload.channel.id;
                var msg = "*Your colleague <@" + sender_id + "> is recommending you add " + skill + " to your xpertz profile.*";

                //Send DM to user
                request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dm_id + '&text=' + msg, (error, res, body) => {
                    if (error) {
                        return console.log(error);
                    } else {
                        // Success when new user joins
                        // console.log(res);
                        return;
                    }
                });
            }
        });
        return;
    },

    // DM's the workspace owner to ask if they want to import a standardized set of expertise tags
    presetTagOptions : function(){

    }
};