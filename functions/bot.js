const request = require('request');
const firebase = require('firebase');
const util = require('./util');
// Get a reference to the database service
var database = firebase.database();
const BOT_TOKEN = 'xoxb-350752158706-372086406743-54hRaX653L9Mg4Kl90DgLGOP';

// Actions executed by our Bot user.
module.exports = {
    // Onboarding msg dm'd to a user that joins the workspace triggered by the team_join event type
    onboardMsg: function (user, res) {

        //Get DM id
        request.get('https://slack.com/api/conversations.open?token=' + BOT_TOKEN + '&users=' + user.user_id, (err, res, body) => {
            if (err) {
                return console.log(err);
            } else {

                let payload = JSON.parse(body);
                let dm_id = payload.channel.id;
                var msg = "*Welcome to the team* <@" + user.user_id + ">! Let's show your new colleagues what skills you bring to the team using Xpertz. You can start by using the `/helper` command to get started.";

                //Send DM to user
                request.post('https://slack.com/api/chat.postMessage?token=' + BOT_TOKEN + '&channel=' + dm_id + '&text=' + msg, (error, res, body) => {
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
    tagRankUp: async function (id) {

        //Get DM id
        request.get('https://slack.com/api/conversations.open?token=' + BOT_TOKEN + '&users=' + id, (err, res, body) => {
            if (err) {
                return console.log(err);
            } else {

                let payload = JSON.parse(body);
                let dm_id = payload.channel.id;
                var msg = "*Congratulations* <@" + id + "> *your <tag_name> expertise has ranked up!*";

                //Send DM to user
                request.post('https://slack.com/api/chat.postMessage?token=' + BOT_TOKEN + '&channel=' + dm_id + '&text=' + msg, (error, res, body) => {
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
    }
};