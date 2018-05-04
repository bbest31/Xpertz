# Xpertz

Introducing Xpertz!

This web based application is designed to provide three things into a slack workspace:

 1. Help users collaborate faster to the appropriate colleague based on skill set and proficiency.
 2. Provide workspaces analytics on how well their employees are collaborating.
 3. Give workspaces/companies insights on their skill set distribution in comparison to their skill set demand.

***

## HTTPS Slash commands

Slash commands must point to a specific URL that corresponds to a Firebase Function. These functions are written inside the functions/index.js file.

### Simple Example

Here is an example of the steps to create and deploy a new slash command. (without auth)

1. Inside the index.js file we create our function that just sends a simple text response back.
```javascript
exports.myFunction = functions.https.onRequest((request, response) => {
res.send(' "text" : "Invoked myFunction" ');
});
```
2. Deploy the project to have the functions available.

```bash
firebase deploy
```

3. Get the appropriate trigger URL for that function. This will be in the Functions tab in the Firebase Console

```
https://us-central1-xpertz-178c0.cloudfunctions.net/myFunction
```

4. In the Slack Application Console go to **Slash Commands** and create a new command using the URL we found above as the Request URL and fill in any other information.

5. Use the command in any of the channels the application has access to adn watch the magic!
