const firebase = require('firebase');
const rp = require('request-promise');

const config = {
    apiKey: "AIzaSyDm6i6hnoJbFO-cPb_6gTV9EmE1g5WqexA",
    authDomain: "xpertz-178c0.firebaseapp.com",
    databaseURL: "https://xpertz-178c0.firebaseio.com/"
};
firebase.initializeApp(config);

// Get a reference to the database service
const database = firebase.database();

const VERIFICATION_TOKEN = 'n2UxTrT7vGYQCSPIXD2dp1th';
const UNAUTHORIZED = 401;
const OK = 200;
const TRIAL_DAYS = 2000;

const TECH_PRESET_TAGS = {
    "Android Developer": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "android developer",
        tag_title: "Android Developer"
    },
    "Java": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "java",
        tag_title: "Java"
    },
    "C++": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "c++",
        tag_title: "C++"
    },
    "C": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "c",
        tag_title: "C"
    },
    "Javascript": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "javascript",
        tag_title: "Javascript"
    },
    "Python": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "python",
        tag_title: "Python"
    },
    "SQL": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "sql",
        tag_title: "SQL"
    },
    "HTML": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "html",
        tag_title: "HTML"
    },
    "CSS": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "css",
        tag_title: "CSS"
    },
    "Angular": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "angular",
        tag_title: "Angular"
    },
    "React JS": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "react js",
        tag_title: "React JS"
    },
    "ExpressJS": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "expressjs",
        tag_title: "ExpressJS"
    },
    "Microservices": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "microservices",
        tag_title: "Microservices"
    },
    "Cloud Infrastructure": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "cloud infrastructure",
        tag_title: "Cloud Infrastructure"
    },
    "Agile Methodology": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "agile methodology",
        tag_title: "Agile Methodology"
    },
    "Project Management": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "project management",
        tag_title: "Project Management"
    },
    "Trello": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "trello",
        tag_title: "Trello"
    },
    "JIRA": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "jira",
        tag_title: "JIRA"
    },
    "Machine Learning": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "machine learning",
        tag_title: "Machine Learning"
    },
    "R": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "r",
        tag_title: "R"
    },
    "Data Science": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "data science",
        tag_title: "Data Science"
    },
    "Matlab": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "matlab",
        tag_title: "Matlab"
    },
    "Simulink": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "simulink",
        tag_title: "Simulink"
    },
    "Docker": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "docker",
        tag_title: "Docker"
    },
    "Jenkins": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "jenkins",
        tag_title: "Jenkins"
    },
    "Kubernetes": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "kubernetes",
        tag_title: "Kubernetes"
    },
    "Data Visualization": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "data visualization",
        tag_title: "Data Visualization"
    },
    "Deep Learning": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "deep learning",
        tag_title: "Deep Learning"
    },
    "Reinforcement Learning": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "reinforcement learning",
        tag_title: "Reinforcement Learning"
    },
    "Design Thinking": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "design thinking",
        tag_title: "Design Thinking"
    },
    "Graphic Design": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "graphic design",
        tag_title: "Graphic Design"
    },
    "iOS Developer": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "ios developer",
        tag_title: "iOS Developer"
    },
    "Adobe Creative Cloud": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "adobe creative cloud",
        tag_title: "Adobe Creative Cloud"
    },
    "Adobe Illustrator": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "adobe illustrator",
        tag_title: "Adobe Illustrator"
    },
    "Photoshop": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "photoshop",
        tag_title: "Photoshop"
    },
    "Inkscape": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "inkscape",
        tag_title: "Inkscape"
    },
    "NoSQL Databases": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "nosql databases",
        tag_title: "NoSQL Databases"
    },
    "MySQL Databases": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "mysql databases",
        tag_title: "MySQL Databases"
    },
    "Slack": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "slack",
        tag_title: "Slack"
    },
    "Apache Kafka": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "apache kafka",
        tag_title: "Apache Kafka"
    },
    "IBM Bluemix": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "ibm bluemix",
        tag_title: "IBM Bluemix"
    },
    "Pivotal Cloud Foundry": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "pivotal cloud foundry",
        tag_title: "Pivotal Cloud Foundry"
    },
    "Blockchain": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "blockchain",
        tag_title: "Blockchain"
    },
    "Git": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "git",
        tag_title: "Git"
    },
    "Google Firebase": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "google firebase",
        tag_title: "Google Firebase"
    },
    "AWS": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "aws",
        tag_title: "AWS"
    },
    "Continuous Integration": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "continuous integration",
        tag_title: "Continuous Integration"
    },
    "Github": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "github",
        tag_title: "Github"
    },
    "Bitbucket": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "bitbucket",
        tag_title: "Bitbucket"
    },
    "Microsoft Excel": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "microsoft excel",
        tag_title: "Microsoft Excel"
    },
    "Microsoft Access": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "microsoft access",
        tag_title: "Microsoft Access"
    },
    "PHP": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "php",
        tag_title: "PHP"
    },
    "Curl": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "curl",
        tag_title: "Curl"
    },
    "Vue&1111js": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "vue.js",
        tag_title: "Vue.js"
    },
    "DevOps": {
        count: 0,
        description: "Software developer for the Android mobile platform developed by Google.",
        tag_code: "devops",
        tag_title: "DevOps"
    }
}

module.exports = {

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
     * @param {string} team_id
     */
    retrieveTeamDoc: function (team_id, res) {
        database.ref('installations/' + team_id).once('value').then(snapshot => {
            if (!snapshot.val()) {
                //No team with that id found
                res(false);
            } else {
                // Existing document with that team id
                res(true);
            }
            return;
        }).catch(err => {
            console.log('Error getting document', err);
            res(false);
            return;
        });
    },

    /**
     * Returns the team document of the requesting workspace by querying the installations document in the database.
     * @param {string} team_id
     */
    retrieveAccessToken: function (team_id, res) {
        database.ref('installations/' + team_id).once('value').then(snapshot => {
            if (!snapshot.val()) {
                //No team with that id found
                res(false);
            } else {
                // Existing document with that team id
                res(snapshot.val().token);
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            res(false);
            return;
        });
    },

    /**
     * Validates the token from the requesting body.
     * @param {string} token
     */
    validateToken: function (token, res) {
        if (!token) {
            res.contentType('json').status(OK).send({
                "text": "_Incorrect request!_"
            });
            return false;
        } else if (token === VERIFICATION_TOKEN) {
            return true;
        } else {
            res.send(UNAUTHORIZED);
            return false;
        }
    },

    validateTeamAccess: function (team_id, response, callback) {
        database.ref('installations/' + team_id).once('value').then(snapshot => {
            if (!snapshot.val()) {
                //No team with that id found
                response.contentType('json').status(OK).send({
                    "response_type": "ephemeral",
                    "replace_original": true,
                    "text": "Request has failed. If this keeps happening, please, contact us at xpertz.software@gmail.com"
                });
            } else {
                //If tier is trial and date it has been more than 30 days after trial started, than team doesn't have access anymore {}
                if (snapshot.val().access.tier === 0) {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var diffDays = Math.round(Math.abs((snapshot.val().access.startedTrial - Date.now()) / (oneDay)));
                    console.log(diffDays);
                    if (diffDays < TRIAL_DAYS) {
                        callback(true);
                        return;
                    } else {
                        response.contentType('json').status(OK).send({
                            "response_type": "ephemeral",
                            "replace_original": true,
                            "text": "*Looks like your trial period has ended. Consult your manager/supervisor about upgrading to keep using Xpertz or contact us at xpertz.software@gmail.com*"
                        });
                    }
                } else {
                    callback(true);
                    return;
                }
            }
            return;
        }).catch(err => {
            console.log('Error getting team doc', err);
            response.contentType('json').status(OK).send({
                "response_type": "ephemeral",
                "replace_original": true,
                "text": "Request has failed. If this keeps happening, please, contact us at xpertz.software@gmail.com"
            });
            return;
        });
    },

    startDirectChat: function (user_id, team_id, token) {
        this.retrieveAccessToken(team_id, token => {
            if (token) {
                let options = {
                    method: "POST",
                    uri: "https://slack.com/api/im.open",
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + token
                    },
                    body: {
                        "user": "user_id",
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
    //        console.log("SUCCESS: ", success);
    //        return;
    //      });
    //
    //   2. This is simpler way to use cancel function, if callback is unnecessary
    //      cancelButtonIsPressed(payload.response_url);
    cancelButtonIsPressed: function (response_url, success) {

        let options = {
            method: "POST",
            uri: response_url,
            body: { "delete_original": true },
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

    groomTheKeyToFirebase: function (key) {
        var newKey = key;
        newKey = newKey.replace(/\./g, "&1111");
        newKey = newKey.replace(/#/g, "&1112");
        newKey = newKey.replace(/\$/g, "&1113");
        newKey = newKey.replace(/\[/g, "&1114");
        newKey = newKey.replace(/\]/g, "&1115");
        return newKey;
    },

    groomTheKeyFromFirebase: function (key) {
        var newKey = key;
        newKey = newKey.replace(/&1111/g, ".");
        newKey = newKey.replace(/&1112/g, "#");
        newKey = newKey.replace(/&1113/g, "$");
        newKey = newKey.replace(/&1114/g, "[");
        newKey = newKey.replace(/&1115/g, "]");
        return newKey;
    },

    rankUpCheck: function (count) {
        if (count === 5 || count === 16 ||
            count === 31 || count === 56 ||
            count === 80 || count === 131 || count === 206) {
            return true;
        } else {
            return false;
        }
    },

    techSkillPreset: function (team_id) {
        database.ref('tags/' + team_id).transaction(teamTags => {

        });
    },
};
