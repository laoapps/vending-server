import cron from 'node-cron';

cron.schedule('* * * * *', async () => {
    try {
        console.log('ทำงานทุก 1 นาที', new Date());
    } catch (error) {
        console.log('error', error);
    }
});