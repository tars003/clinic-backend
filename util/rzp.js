const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new Razorpay({
    key_id: process.env.RP_ID,
    key_secret: process.env.RP_SECRET,
});


const createOrder = async (amount, currency, receipt, notes) => {
    try {
        console.log(amount, currency);
        const fee = amount*100;
        console.log('Creating rzp order');
        console.log(fee, currency, receipt, notes);
        const order = await razorpayInstance.orders.create({amount: fee, currency, receipt, notes});
        return order;
    } catch (err) {
        console.log('error creating rzp order');
        console.log(err);
        return ({});
    }
}

const confirmPayment = (orderId, paymentId, sig) => {
    let hmac = crypto.createHmac('sha256', process.env.RP_SECRET); 
    hmac.update(orderId + "|" + paymentId);
    const generated_signature = hmac.digest('hex');
    
    if(sig===generated_signature) return true
    else return false;
}

const randomStr = (len, arr) => {
    var ans = '';
    for (var i = len; i > 0; i--) {
        ans +=
            arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
}

module.exports = {confirmPayment, createOrder, randomStr}


