import Alexa from 'ask-sdk-core';

const HouseholdListEventHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return (
      requestType === 'AlexaHouseholdListEvent.ItemsCreated' ||
      requestType === 'AlexaHouseholdListEvent.ItemsUpdated' ||
      requestType === 'AlexaHouseholdListEvent.ItemsDeleted'
    );
  },
  async handle(handlerInput) {
    try {
      await fetch(process.env.CUSTOM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(handlerInput.requestEnvelope)
      });
      console.log('Request forwarded to custom endpoint', process.env.CUSTOM_ENDPOINT);
    } catch (error) {
      console.error('Failed to handle household list items event:', error.message);
    }
  }
};

const SkillEventHandler = {
  canHandle(handlerInput) {
    const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
    return (
      requestType === 'AlexaSkillEvent.SkillDisabled' ||
      requestType === 'AlexaSkillEvent.SkillPermissionAccepted' ||
      requestType === 'AlexaSkillEvent.SkillPermissionChanged'
    );
  },
  async handle(handlerInput) {
    try {
      // Determine accepted permissions
      const permissions = (handlerInput.requestEnvelope.request.body.acceptedPermissions || []).map((permission) =>
        permission.scope.split(':').pop()
      );
      // Update alexa shopping list if read/write permissions accepted, otherwise clean up database
      if (permissions.includes('read') && permissions.includes('write')) {
        await fetch(process.env.CUSTOM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(handlerInput.requestEnvelope)
        });
        console.log('Request forwarded to custom endpoint', process.env.CUSTOM_ENDPOINT);
        console.log('User has accepted read/write permissions.');
      } else {
        console.log('User has not accepted read/write permissions.');
      }
    } catch (error) {
      console.error('Failed to handle skill permission event:', error.message);
    }
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Request error:', error);
  }
};

const LogRequestInterceptor = {
  process(handlerInput) {
    if (typeof handlerInput.requestEnvelope !== 'undefined') {
      console.log('Request received:', JSON.stringify(handlerInput.requestEnvelope));
    }
  }
};

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(HouseholdListEventHandler, SkillEventHandler)
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LogRequestInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .withSkillId(process.env.SKILL_ID)
  .lambda();
