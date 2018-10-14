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
        var team_id = user.team_id;
        var enterprise_id = user.enterprise_id;
        var id = null;

        var ref = 'installations/';
        if (enterprise_id) {
            ref += enterprise_id + '/';
            id = enterprise_id;
        } else {
            ref += team_id + '/';
            id = team_id;
        }
        ref += '/token';

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
    tagRankUp: function () {

    }
};