const moment = require('moment');

const isCouponValid =  (coupon, appDate) => {

    if(coupon.percentOff == 0) {
        return true;
    }

    const currDate = moment(appDate, 'DD-MM-YYYY');
    const start = moment(coupon.startDate, 'DD-MM-YYYY');
    const end = moment(coupon.endDate, 'DD-MM-YYYY');
    // console.log(currDate.diff(end, 'days'));
    // console.log(currDate.diff(start, 'days'));
    const flag = currDate.diff(start, 'days') >= 0 && currDate.diff(end, 'days') < 0 ? true : false
    return flag;
}

const isCouponApplicable =  (coupon, patientId) => {

    if(coupon.percentOff == 0) {
        return true;
    }

    let flag = false;
    if(coupon.exclusivePatients) {
        if(coupon.exclusivePatients.length > 0) {
            if(coupon.exclusivePatients.includes(patientId))
                flag = true;
            else
                return flag
        }
        
    } else {
        
    }
    if(coupon.patients) {
        if(coupon.patients.length > 0) {
            const patientIds = coupon.patients.map(obj => obj.id);
            console.log('patientIds');
            console.log(patientIds);
            if(patientIds.includes(patientId)) {
                flag = false
                console.log('coupon already used')
            }
            else 
                flag = true
        }
        else
            flag = true;
    }
    
    return flag;
}


module.exports = { isCouponApplicable, isCouponValid }