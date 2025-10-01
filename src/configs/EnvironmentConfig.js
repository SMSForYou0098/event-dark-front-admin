const config = {
  development: {
    API_ENDPOINT_URL: process.env.REACT_APP_API_ENDPOINT_URL
  },
  production: {
    API_ENDPOINT_URL: process.env.REACT_APP_API_ENDPOINT_URL
  },
  test: {
    API_ENDPOINT_URL: process.env.REACT_APP_API_ENDPOINT_URL
  }
};

const getEnv = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return config.development;
    case 'production':
      return config.production;
    case 'test':
      return config.test;
    default:
      // Fallback to development if NODE_ENV is unexpected or undefined
      return config.development;
  }
};

export const env = getEnv();
