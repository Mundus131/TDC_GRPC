module.exports = {
  grpc: {
    host: process.env.TDC_GRPC_HOST || '192.168.0.100',
    port: Number(process.env.TDC_GRPC_PORT || 8081)
  },
  auth: {
    loginUrl: process.env.TDC_AUTH_LOGIN_URL || 'http://192.168.0.100/auth/login',
    username: process.env.TDC_AUTH_USERNAME || 'admin',
    password: process.env.TDC_AUTH_PASSWORD || '',
    realm: process.env.TDC_AUTH_REALM || 'admin'
  },
  server: {
    port: 3000,
    monitoringInterval: 5000 // 5 sekund
  }
};
