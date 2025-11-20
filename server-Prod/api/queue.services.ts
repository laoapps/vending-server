import PQueue from "p-queue";

export const apiQueue = new PQueue({
    concurrency: 10,
    interval: 1000,
    intervalCap: 15
});
