// PayU config for sandbox/test
module.exports = {
  key: process.env.PAYU_KEY || 'gtKFFx', // Demo key
  salt: process.env.PAYU_SALT || '4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW', // Correct demo salt
  base_url: 'https://test.payu.in/_payment', // Sandbox endpoint
  success_url: '/book/success',
  failure_url: '/book/failure',
};
