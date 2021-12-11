const axios = require('axios');

const sendSMS = async (recepientNo, text) => {

    var smsRootUrl = process.env.smsRootUrl;
    var smsUserId = process.env.smsUserId;
    var smsKey = process.env.smsKey;
    var smsSender = process.env.smsSender;
    var smsDLTEntityId = process.env.smsDLTEntityId;
    var smsDLTTemplateId = process.env.smsDLTTemplateId;


    var endpoint = `${smsRootUrl}?user=${smsUserId}&key=${smsKey}&sender=${smsSender}&mobile=${recepientNo}&text=${text}&entityid=${smsDLTEntityId}&templateid=${smsDLTTemplateId}`;

    console.log('endpoint', endpoint);

    const response = await axios.get(endpoint);
    console.log(response.data); 
    return response.data;


}


module.exports = { sendSMS }
