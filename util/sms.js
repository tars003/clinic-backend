const axios = require('axios');

const sendSMS = async (recepientNo, text, templateId) => {

    var smsRootUrl = process.env.smsRootUrl;
    var smsUserId = process.env.smsUserId;
    var smsKey = process.env.smsKey;
    var smsSender = process.env.smsSender;
    var smsDLTEntityId = process.env.smsDLTEntityId;
    var smsDLTTemplateId = templateId;


    var endpoint = `${smsRootUrl}?user=${smsUserId}&key=${smsKey}&sender=${smsSender}&mobile=${recepientNo}&text=${text}&entityid=${smsDLTEntityId}&templateid=${smsDLTTemplateId}`;

    console.log('endpoint', endpoint);

    const response = await axios.get(endpoint);
    console.log(response.data); 
    return response.data;


}

const sendSMSLater = async (recepientNo, text, templateId, date) => {

    var smsRootUrl = process.env.smsRootUrl;
    var smsUserId = process.env.smsUserId;
    var smsKey = process.env.smsKey;
    var smsSender = process.env.smsSender;
    var smsDLTEntityId = process.env.smsDLTEntityId;
    var smsDLTTemplateId = templateId;


    var endpoint = `${smsRootUrl}?user=${smsUserId}&key=${smsKey}&sender=${smsSender}&mobile=${recepientNo}&text=${text}&entityid=${smsDLTEntityId}&templateid=${smsDLTTemplateId}&time=${date}&rpt=1`;

    console.log('endpoint', endpoint);

    const response = await axios.get(endpoint);
    console.log(response.data); 
    return response.data;


}


module.exports = { sendSMS, sendSMSLater }
