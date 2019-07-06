const firebase = require('firebase');
const rp = require('request-promise');
const sha256 = require('js-sha256');

const config = {
    apiKey: 'AIzaSyDm6i6hnoJbFO-cPb_6gTV9EmE1g5WqexA',
    authDomain: 'xpertz-178c0.firebaseapp.com',
    databaseURL: 'https://xpertz-178c0-dev.firebaseio.com/'
};
firebase.initializeApp(config);

const crypto = require('crypto');
const qs = require('qs');

// Get a reference to the database service
const database = firebase.database();

const VERIFICATION_TOKEN = 'n2UxTrT7vGYQCSPIXD2dp1th';
const SIGNING_SECRET = 'f41627be5a6a77d26592fbac903a37f7';
const SIGNING_SECRET_DEV = 'da9615edcf644fe5e398f50697fb9c76';
const UNAUTHORIZED = 401;
const OK = 200;
const TRIAL_DAYS = 2000;

module.exports = {

    /**
     * Encapsulated method for sending http requests by just passing the options
     * for json encoded bodies.
     * @param {*} options 
     * @param {*} success 
     * @param {*} failure 
     */
    makeRequestWithOptions: function (options, success, failure) {
        rp(options)
            .then(response => {
                if (response) console.log(response);
                if (success) success(response);
                return;
            })
            .catch(err => {
                if (err) console.log(err);
                if (failure) failure(err);
                return;
            });
    },

    /**
     * Returns the team document of the requesting workspace by querying the installations document in the database.
     * @param {string} teamId
     */
    retrieveTeamData: function (teamId, res) {
        database.ref('organizations').orderByChild('slack_team_id').equalTo(teamId).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                    // Existing document with that team id
                    res(true);
                } else {
                    res(false);
                }
                return;
            }).catch(err => {
                console.error('retrieveTeamData: ', err);
                res(false);
                return;
            });
    },

    /**
     * Returns the team node of the requesting workspace by querying the organizations node in the database.
     * @param {string} teamId
     */
    retrieveAccessToken: function (teamId, res) {
        database.ref('organizations').orderByChild('slack_team_id').equalTo(teamId).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                    // Existing org with that team id
                    res(Object.values(snapshot.val())[0].token);
                } else {
                    res(false);
                }
                return;
            }).catch(err => {
                console.err("retrieveAccessToken: ", err);
                res(false);
                return;
            });
    },

    /**
     * Validates the token from the requesting body.
     * @param {string} token
     */
    validateRequest: function (req, res) {

        if (req !== null && req !== undefined &&
            req.rawBody !== null && req.rawBody !== undefined &&
            req.headers['x-slack-request-timestamp'] !== null && req.headers['x-slack-request-timestamp'] !== undefined &&
            req.headers['x-slack-signature'] !== null && req.headers['x-slack-signature'] !== undefined) {

            const requestBody = req.rawBody.toString('utf8');
            const requestTimestamp = req.headers['x-slack-request-timestamp'];
            const requestSignature = req.headers['x-slack-signature'];

            // The request timestamp is more than five minutes from local time.
            // It could be a replay attack, so let's ignore it.
            // convert current time from milliseconds to seconds
            const time = Math.floor(new Date().getTime() / 1000);

            if (Math.abs(time - requestTimestamp) > 60 * 5) {
                console.log("More than 5 minutes has passed");
                res.send(UNAUTHORIZED);
                return false;
            }

            // const hmac = crypto.createHmac('sha256', "5002f9a3a9540f85d0a88be5f7bc2e7c");
            const [version, hash] = requestSignature.split('=');
            // hmac.update(`${version}:${requestTimestamp}:${requestBody}`);

            var hashSha = sha256.hmac.create(SIGNING_SECRET_DEV);
            hashSha.update(`${version}:${requestTimestamp}:${requestBody}`);

            if (!crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(hashSha.hex(), 'utf8'))) {
                console.log("Failed verification comparison");
                res.send(UNAUTHORIZED);
                return false;
            }

            //hooray, the request came from Slack!
            console.log("Verification success");
            return true;
        } else {
            res.send(UNAUTHORIZED);
            return false;
        }
    },

    /**
     * Ensure the Slack team that is sending a request has access to use our slack bot.
     * @param {string} teamId 
     * @param {*} response 
     * @param {*} callback 
     */
    validateTeamAccess: function (teamId, response, callback) {
        database.ref('organizations').orderByChild('slack_team_id').equalTo(teamId).once('value').then(snapshot => {
            if (!snapshot.val() && Object.values(snapshot.val()).length > 0) {
                //No team with that id found
                console.warn("validateTeamAccess: Unauthorized attempt to access!: ", teamId);
                response.contentType('json').status(UNAUTHORIZED).send();
                callback(false);
                return;
            } else {
                callback(true);
                return;
            }

        }).catch(err => {
            console.error('validateTeamAccess', err);
            response.contentType('json').status(OK).send({
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': 'Request has failed. If this keeps happening, please, contact us at xpertz.software@gmail.com'
            });
            callback(false);
            return;
        });
    },

    /**
     * 
     * @param {*} userId 
     * @param {*} teamId 
     * @param {*} token 
     */
    startDirectChat: function (userId, teamId, token) {
        this.retrieveAccessToken(teamId, token => {
            if (token) {
                let options = {
                    method: 'POST',
                    uri: 'https://slack.com/api/im.open',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + token
                    },
                    body: {
                        'user': 'user_id',
                    },
                    json: true
                }

                this.makeRequestWithOptions(options);
            }
        });
    },

    //POSSIBLE USAGE OF cancelButtonIsPressed FUNCTION:
    //
    //   1. This is one way to use the cancel function with the callback block, if something needs to be cleaned up in the database let's say.
    //      cancelButtonIsPressed(payload.response_url, success => {
    //        console.log('SUCCESS: ', success);
    //        return;
    //      });
    //
    //   2. This is simpler way to use cancel function, if callback is unnecessary
    //      cancelButtonIsPressed(payload.response_url);
    /**
     * Http post method to delete a message in Slack triggered by the pressing of a cancel button.
     * @param {string} responseURL 
     * @param {*} success 
     */
    cancelButtonIsPressed: function (responseURL, success) {

        let options = {
            method: 'POST',
            uri: responseURL,
            body: { 'delete_original': true },
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
    },

    /**
     * Alters a key string such that Firebase will accept its format by replacing characters it does not support in keys.
     * @param {string} key - the key for a key-value pair in firebase db.
     */
    groomKeyToFirebase: function (key) {
        var newKey = key;
        newKey = newKey.replace(/\./g, '&1111');
        newKey = newKey.replace(/#/g, '&1112');
        newKey = newKey.replace(/\$/g, '&1113');
        newKey = newKey.replace(/\[/g, '&1114');
        newKey = newKey.replace(/\]/g, '&1115');
        newKey = newKey.replace(/\//g, '&1116');
        newKey = newKey.replace(/\\/g, '&1117');
        return newKey;
    },

    /**
     * Computes the original form of the key that was mutated in order to conform to Firebase key syntax rules.
     * @param {string} key - the key for a key-value pair in firebase db.
     */
    groomKeyFromFirebase: function (key) {
        var newKey = key;
        newKey = newKey.replace(/&1111/g, '.');
        newKey = newKey.replace(/&1112/g, '#');
        newKey = newKey.replace(/&1113/g, '$');
        newKey = newKey.replace(/&1114/g, '[');
        newKey = newKey.replace(/&1115/g, ']');
        newKey = newKey.replace(/&1116/g, '/');
        newKey = newKey.replace(/&1117/g, '\\');
        return newKey;
    },

    /**
     * Checks to see if the high-five count for some tag breaks a rank up threshold resulting in an increase its rank.
     * @param {number} count 
     */
    rankUpCheck: function (count) {
        if (count === 5 || count === 16 ||
            count === 31 || count === 56 ||
            count === 80 || count === 131 || count === 206) {
            return true;
        } else {
            return false;
        }
    },

    heartbeatResponse: function (res) {
        console.log('Heartbeat function execution.');
        res.contentType('json').status(OK).send({
            'text': 'Received Heartbeat'
        });
    },

    /**
     * Check to see if the the team id or enterprise id is being provided.
     * @param {Request} req 
     */
    correctIdFromRequest: function (req) {
        if (req.body.enterprise_id) {
            return req.body.enterprise_id;
        } else {
            return req.body.team_id;
        }
    },

    /**
     * Returns the correct team id type to be using within a payload and as well the proper query param to use.
     * @param {*} payload 
     */
    correctIdFromPayload: function (payload) {
        let values = {};
        if (payload.team.enterprise_id) {
            values = {
                id_type: "slack_enterprise_id",
                id: payload.team.enterprise_id
            };
        } else {
            values = {
                id_type: "slack_team_id",
                id: payload.team.team_id
            };
        }
        return values;
    },

    /**
     * Checks to see if the slack user has made an Xpertz account yet under their organization.
     * @param {string} userId - the slack guid for the user
     */
    slackUserExists: function (userId, orgIdJSON, callback) {
        database.ref('organizations').orderByChild(orgIdJSON['id_type']).equalTo(orgIdJSON['id']).once('value').then(snapshot => {
            if (snapshot.val() && Object.keys(snapshot.val()).length > 0) {
                let users = snapshot.child('users');
                Object.values(users).forEach(user => {
                    if (user.third_party.slack_id === userId) {
                        callback(true);
                        return;
                    }
                });
                callback(false);
                return;
            } else {
                console.warn("slackUserExists: UNAUTHORIZED ACCESS ATTEMPT!");
                callback(false);
                return;
            }
        }).catch(err => {
            console.error('slackUserExists: ', err);
            callback(false);
            return;
        });
    },

    /**
     * 
     * @param {*} orgIdJSON 
     * @param {*} callback 
     */
    xpertzOrgExists: function (orgIdJSON, callback) {
        database.ref('organizations').orderByChild(orgIdJSON['id_type']).equalTo(orgIdJSON['id']).once('value').then(snapshot => {
            if (snapshot.val() && Object.keys(snapshot.val()).length > 0) {
                // This slack workspace is associated with an xpertz organization
                callback(true);
                return;
            }
            console.warn('xpertzOrgExists: UNAUTHORIZED ACCESS ATTEMPT!');
            callback(false);
            return;
        }).catch(err => {
            console.error("xpertzOrgExists: ", err);
        });

    },

    /**
     * Updates the global user and org counts in the db.
     * @param {*} res 
     */
    updateGlobals: function (res) {

        // Update the global user count
        database.ref('users').once('value').then((snapshot) => {
            if (snapshot.val()) {
                const userCount = snapshot.numChildren();
                let updates = {};
                updates['/user_count'] = userCount;
                database.ref('globals').update(updates);
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            return;
        });

        // Update the global enterprise org count
        database.ref('organizations').orderByChild('plan').equalTo('enterprise').once('value').then((snapshot) => {
            if (snapshot.val()) {
                const orgCount = snapshot.numChildren();
                let updates = {};
                updates['/enterprise_org_count'] = orgCount;
                database.ref('globals').update(updates);
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            return;
        });


        // Update the global business org count
        database.ref('organizations').orderByChild('plan').equalTo('business').once('value').then((snapshot) => {
            if (snapshot.val()) {
                const orgCount = snapshot.numChildren();
                let updates = {};
                updates['/business_org_count'] = orgCount;
                database.ref('globals').update(updates);
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            return;
        });

        // Update the global free org count
        database.ref('organizations').orderByChild('plan').equalTo('free').once('value').then((snapshot) => {
            if (snapshot.val()) {
                const orgCount = snapshot.numChildren();
                let updates = {};
                updates['/free_org_count'] = orgCount;
                database.ref('globals').update(updates);
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            return;
        });


        res.contentType('json').status(OK).send();
        return;
    },



};
