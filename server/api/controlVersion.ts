import { Router } from "express";
import Queue from "bull";
import events from "events";

events.defaultMaxListeners = 100;
events.EventEmitter.prototype.setMaxListeners(100);
import { WritePanel } from "../versioncontrol/controllers/vending_machine/panels/write.panel";
import { APIAdminAccess } from "../services/laab.service";
import { redisHost, redisPort } from "../services/service";

export let QCreateVendingVersion = new Queue('QCreateVendingVersion', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });

export class ControlVersionAPI {

    private writePanel: WritePanel;
    private vendingVersionQueues: any = {
        QCreateVendingVersion:QCreateVendingVersion,
    }
    constructor(router: Router) {
        this.writePanel = new WritePanel(this.vendingVersionQueues);
        
        router.post('/zdm8/vending-version/create', APIAdminAccess, this.writePanel.CreateVersion.bind(this.writePanel));

        QCreateVendingVersion.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.writePanel._CreateVersion(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
    }


}