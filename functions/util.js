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
        res.sendStatus(UNAUTHORIZED);
        return false;
    }
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
  }
};
