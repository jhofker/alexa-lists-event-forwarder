# alexa-lists-event-forwarder

## Introduction

This provides a way to get out of the Alexa system with your shopping lists and to-dos on Echo devices. Provide your own custom endpoint to send all item and list changes to, and do whatever you want with that information.

This is based HEAVILY on the great work of [@jsetton](https://github.com/jsetton/alexa-ourgroceries-sync) and the unofficial OurGroceries skill he made. In fact, you should probably consider just using that Skill instead. Use this only if you want to forward events to a custom endpoint (like your own server) and not have to think about lambdas again.

Why not just make a Skill with a custom handler? For the life of me, I could not get list events to actually send all the way through, even when account linking was fully set up and used. Skill events (install, uninstall, etc) came through, but not list events.

It is leveraging the Alexa Skills Kit Command Line Interface (ASK CLI) to streamline the deployment process.

## Prerequisites

### Alexa Skills Kit CLI with Amazon AWS and Developer Accounts

You need an [AWS account](https://aws.amazon.com) and an [Amazon developer account](https://developer.amazon.com) to create an Alexa Skill.

In order to use the ASK CLI features to automatically deploy and manage your Lambda skill, ensure that you have AWS credentials set up with the appropriate permissions on the computer to which you are installing ASK CLI, as described in [Set Up Credentials for an Amazon Web Services (AWS) Account](https://developer.amazon.com/docs/smapi/set-up-credentials-for-an-amazon-web-services-account.html).

You will have to install the latest [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html), and then configure it:

```shell
npm install -g ask-cli
ask configure
```

By default, the ASK CLI deploys the skill resources in the `us-east-1` region. You will need to change your deploy region based on the skill language you are planning to use. You should refer to the table below, based on the [smart home multi-languages development guidelines](https://developer.amazon.com/docs/smarthome/develop-smart-home-skills-in-multiple-languages.html#deploy):

| Skill Language | Endpoint Region | Deploy Region |
| -------------- | --------------- | ------------- |
| English (CA), English (US) | North America | `us-east-1` |
| English (UK) | Europe | `eu-west-1` |
| English (IN) | India | `eu-west-1` |
| English (AU) | Far East | `us-west-2` |

To change your deploy region, update the `awsRegion` skill infrastructure user config parameter in [`ask-resources.json`](ask-resources.json).

### Login with Amazon Security Profile

In order to fulfill the skill account linking requirement, you need to create a [Login with Amazon](https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html) (LWA) security profile and take a note of the associated OAuth2 credentials. See [this post](https://developer.amazon.com/public/community/post/Tx3CX1ETRZZ2NPC/Alexa-Account-Linking-5-Steps-to-Seamlessly-Link-Your-Alexa-Skill-with-Login-wit) to set it up for your private skill. Fill the [Create Security Profile](https://developer.amazon.com/loginwithamazon/console/site/lwa/create-security-profile.html) form as follow:

* Security Profile Name: `alexa-lists-event-forwarder`
* Security Profile Description: ` Alexa Shopping List Synchronization Skill`
* Consent Privacy Notice URL: `<your-privacy-url>`

Once created, take note of the OAuth2 credentials and update the Web Settings as below. The Allowed Return URL should include your [vendor ID](https://developer.amazon.com/settings/console/mycid).

* Allowed Return URLs: `https://pitangui.amazon.com/api/skill/link/<vendorId>`

## Deployment

1. Configure the deployment parameters in [`ask-resources.json`](ask-resources.json):

    | Parameter | Description |
    |-----------|-------------|
    | `CustomEndpoint` | Your custom endpoint where you want events forwarded. |

2. Deploy the skill and all AWS resources in one step:
    ```shell
    ask deploy
    ```

3. Setup the skill account linking:
    1. Create the skill account linking request file as `accountLinking.json`, adding your [LWA Security Profile](#login-with-amazon-security-profile) OAuth2 credentials:
        ```json
        {
          "accountLinkingRequest": {
            "skipOnEnablement": "false",
            "type": "AUTH_CODE",
            "authorizationUrl": "https://www.amazon.com/ap/oa",
            "accessTokenUrl": "https://api.amazon.com/auth/o2/token",
            "accessTokenScheme": "HTTP_BASIC",
            "clientId": "<clientId>",
            "clientSecret": "<clientSecret>",
            "scopes": [
              "profile"
            ]
          }
        }
        ```

    2. Update the skill account linking information, using the skill ID displayed in the deploy step:
        ```shell
        ask smapi update-account-linking-info -s <skillId> --account-linking-request file:accountLinking.json
        ```
4. Enable the skill on your Alexa account:
    * In your Alexa app, go to More > Skills & Games page
    * Select the "Alexa List Sync" skill under Your Skills > Dev tab
    * Tap "Enable to Use" and go through the account linking process
    * Grant the Lists Read/Write Access permissions

5. That should be it! Now, just say to your Echo device: "*Alexa, add milk and eggs to my shopping list*". You should see two events forwarded to your custom endpoint. Use the information provided to do whatever you want to do with the Alexa API.
