// paymentGatewayConfig.js
export const PAYMENT_GATEWAY_CONFIG = {
  razorpay: {
    title: 'Razorpay',
    fields: [
      {
        name: 'razorpay_key',
        label: 'Razorpay Key',
        gatewayKey: 'razorpay_key',
        placeholder: 'Enter Razorpay Key'
      },
      {
        name: 'razorpay_secret',
        label: 'Razorpay Secret',
        gatewayKey: 'razorpay_secret',
        placeholder: 'Enter Razorpay Secret'
      }
    ],
    apiEndpoint: 'store-razorpay',
    hasEnvironment: false
  },
  instamojo: {
    title: 'Instamojo',
    fields: [
      {
        name: 'instamojo_api_key',
        label: 'InstaMozo Private API Key',
        gatewayKey: 'instamojo_api_key',
        placeholder: 'Enter InstaMozo API Key'
      },
      {
        name: 'instamojo_auth_token',
        label: 'InstaMozo Private Auth Token',
        gatewayKey: 'instamojo_auth_token',
        placeholder: 'Enter InstaMozo Auth Token'
      }
    ],
    apiEndpoint: 'store-instamojo',
    hasEnvironment: false
  },
  easebuzz: {
    title: 'Easebuzz',
    fields: [
      {
        name: 'easebuzz_key',
        label: 'Easebuzz Merchant Key',
        gatewayKey: 'merchant_key',
        placeholder: 'Enter Easebuzz Merchant Key'
      },
      {
        name: 'easebuzz_salt',
        label: 'Easebuzz Salt',
        gatewayKey: 'salt',
        placeholder: 'Enter Easebuzz Salt'
      }
    ],
    apiEndpoint: 'store-easebuzz',
    hasEnvironment: true
  },
  paytm: {
    title: 'Paytm',
    fields: [
      {
        name: 'merchant_id',
        label: 'Paytm Merchant ID',
        gatewayKey: 'merchant_id',
        placeholder: 'Enter Paytm Merchant ID'
      },
      {
        name: 'merchant_key',
        label: 'Paytm Merchant Key',
        gatewayKey: 'merchant_key',
        placeholder: 'Enter Paytm Merchant Key'
      },
      {
        name: 'merchant_website',
        label: 'Paytm Merchant Website',
        gatewayKey: 'merchant_website',
        placeholder: 'Enter Paytm Merchant Website'
      },
      {
        name: 'industry_type',
        label: 'Paytm Industry Type',
        gatewayKey: 'industry_type',
        placeholder: 'Enter Paytm Industry Type'
      },
      {
        name: 'channel',
        label: 'Paytm Channel',
        gatewayKey: 'channel',
        placeholder: 'Enter Paytm Channel'
      }
    ],
    apiEndpoint: 'store-paytm',
    hasEnvironment: false
  },
  stripe: {
    title: 'Stripe',
    fields: [
      {
        name: 'stripe_key',
        label: 'Stripe Key',
        gatewayKey: 'stripe_key',
        placeholder: 'Enter Stripe Key'
      },
      {
        name: 'stripe_secret',
        label: 'Stripe Secret',
        gatewayKey: 'stripe_secret',
        placeholder: 'Enter Stripe Secret'
      }
    ],
    apiEndpoint: 'store-stripe',
    hasEnvironment: false
  },
  paypal: {
    title: 'PayPal',
    fields: [
      {
        name: 'client_id',
        label: 'PayPal Client ID',
        gatewayKey: 'client_id',
        placeholder: 'Enter PayPal Client ID'
      },
      {
        name: 'secret',
        label: 'PayPal Secret',
        gatewayKey: 'secret',
        placeholder: 'Enter PayPal Secret'
      }
    ],
    apiEndpoint: 'store-paypal',
    hasEnvironment: false
  },
  phonepe: {
    title: 'PhonePe',
    fields: [
      {
        name: 'client_id',
        label: 'PhonePe Client ID',
        gatewayKey: 'client_id',
        placeholder: 'Enter PhonePe Client ID'
      },
      {
        name: 'secret',
        label: 'PhonePe Secret',
        gatewayKey: 'secret',
        placeholder: 'Enter PhonePe Secret'
      }
    ],
    apiEndpoint: 'store-phonepe',
    hasEnvironment: false
  },
  cashfree: {
    title: 'CashFree',
    fields: [
      {
        name: 'app_id',
        label: 'CashFree App ID',
        gatewayKey: 'app_id',
        placeholder: 'Enter CashFree App ID'
      },
      {
        name: 'secret_key',
        label: 'CashFree Secret',
        gatewayKey: 'secret_key',
        placeholder: 'Enter CashFree Secret'
      }
    ],
    apiEndpoint: 'store-cashfree',
    hasEnvironment: true
  }
};

export const PAYMENT_GATEWAY_MENU = Object.entries(PAYMENT_GATEWAY_CONFIG).map(([key, config], index) => ({
  eventKey: key,
  title: config.title
}));