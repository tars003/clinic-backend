const moment = require('moment');

// Time format (24 hrs) ->  17-04-2000 12:40
const generateSlots = (startTime, endTime, consultationTime, gapTime, date) =>  {
    const start = moment(`${date} ${startTime}`, "DD-MM-YYYY HH:mm");
    const end = moment(`${date} ${endTime}`, "DD-MM-YYYY HH:mm");
    const slots = end.diff(start, 'minutes') / (gapTime + consultationTime);

    var slotArr = [];
    var lastTime = startTime;
    for(let i=0; i<slots; i++) {
      slotTime = `${lastTime} - ${moment(`${date} ${lastTime}`, "DD-MM-YYYY HH:mm").add(consultationTime, 'minutes').format('HH:mm')}`;
      slotArr.push({
        slot : slotTime,
        booked: false
      });
      lastTime = moment(`${date} ${lastTime}`, "DD-MM-YYYY HH:mm").add(consultationTime, 'minutes').add(gapTime, 'minutes').format('HH:mm');
    }

    return slotArr;
}


// console.log(generateSlots('08:00', '20:00', 25, 15, '27-05-21'))
module.exports = generateSlots;
