// config/env.ts
// Configuração centralizada de variáveis de ambiente

export const config = {
  // Servidor
  server: {
    port: parseInt(process.env.PORT || '4000'),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Banco de dados
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'onethy',
    user: process.env.DB_USER || 'onethy_user',
    password: process.env.DB_PASSWORD || '',
    url: process.env.DATABASE_URL || ''
  },

  // JWT & Auth
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    sessionSecret: process.env.SESSION_SECRET || 'session-secret'
  },

  // Evolution API (WhatsApp)
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'onethy_instance',
    webhookUrl: process.env.EVOLUTION_WEBHOOK_URL || ''
  },

  // Mercado Pago
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
    webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
    webhookUrl: process.env.MERCADO_PAGO_WEBHOOK_URL || '',
    successUrl: process.env.MERCADO_PAGO_SUCCESS_URL || '',
    failureUrl: process.env.MERCADO_PAGO_FAILURE_URL || '',
    pendingUrl: process.env.MERCADO_PAGO_PENDING_URL || ''
  },

  // Email
  email: {
    smtpHost: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    smtpUser: process.env.EMAIL_SMTP_USER || '',
    smtpPass: process.env.EMAIL_SMTP_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'ONETHY Platform',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@onethy.com'
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0')
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || ''
  },

  // Segurança
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },

  // Planos
  plans: {
    freeMessageLimit: parseInt(process.env.FREE_PLAN_MESSAGE_LIMIT || '100'),
    proMessageLimit: parseInt(process.env.PRO_PLAN_MESSAGE_LIMIT || '5000'),
    enterpriseMessageLimit: parseInt(process.env.ENTERPRISE_PLAN_MESSAGE_LIMIT || '50000')
  },

  // Logs & Monitoramento
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'debug',
    sentryDsn: process.env.SENTRY_DSN || ''
  },

  // Chatbot
  chatbot: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    defaultLanguage: process.env.CHATBOT_DEFAULT_LANGUAGE || 'pt-br',
    maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS || '500')
  }
};

// Função para validar configurações críticas
export const validateConfig = (): string[] => {
  const errors: string[] = [];

  if (!config.auth.jwtSecret || config.auth.jwtSecret === 'supersecret') {
    errors.push('JWT_SECRET deve ser definido com um valor seguro');
  }

  if (!config.database.password) {
    errors.push('DB_PASSWORD deve ser definida');
  }

  if (!config.database.url) {
    errors.push('DATABASE_URL deve ser definida');
  }

  return errors;
};

// Função para exibir resumo da configuração
export const showConfigSummary = () => {
  console.log('\n🚀 ONETHY - Configuração do Servidor');
  console.log('=====================================');
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`Server: ${config.server.host}:${config.server.port}`);
  console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
  console.log(`Frontend: ${config.server.frontendUrl}`);
  console.log(`CORS Origins: ${config.server.corsOrigins.join(', ')}`);
  
  const validationErrors = validateConfig();
  if (validationErrors.length > 0) {
    console.log('\n⚠️  Avisos de Configuração:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('=====================================\n');
};
