const axios = require('axios');

const sendSMS = (recepientNo, text) => {

    var rootUrl = 'http://nimbusit.info/api/pushsms.php';
    var profileId = '';
    var apiKey = '';
    var senderId = '';
    var dltEntityId = '';
    var dltTemplateId = '';


    var endpoint = `${rootUrl}?user=${profileId}&key=${apiKey}&sender=${senderId}&mobile=${recepientNo}&text=${text}&entityid=${dltEntityId}d&templateid=${dltTemplateId}`;

    axios.get(endpoint)
        .then(data => console.log(data))
        .catch(err => console.log(err));


}

module.exports = { sendSMS }