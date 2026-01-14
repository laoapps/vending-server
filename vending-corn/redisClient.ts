import Redis from 'ioredis';


const redisClient = new Redis({
    host: process.env.REDIS_SERVER_HOST!,
    port: Number(process.env.REDIS_SERVER_PORT) || 6379,
    connectTimeout: 5000,
    maxRetriesPerRequest: 5,
    retryStrategy: (times) => Math.min(times * 100, 3000),
});


redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

export default redisClient;
