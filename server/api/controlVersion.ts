import { Router } from "express";
import Queue from "bull";
import events from "events";

events.defaultMaxListeners = 100;
events.EventEmitter.prototype.setMaxListeners(100);
import { WritePanel } from "../versioncontrol/controllers/vending_machine/panels/write.panel";
import { ReadPanel } from "../versioncontrol/controllers/vending_machine/panels/read.panel";

import { APIAdminAccess } from "../services/laab.service";
import { redisHost, redisPort } from "../services/service";

export let QCreateVendingVersion = new Queue('QCreateVendingVersion', { defaultJobOptions: { removeOnComplete: true, removeOnFail: true }, redis: { host: redisHost, port: redisPort } });

export class ControlVersionAPI {

    private vendingVersionQueues: any = {
        QCreateVendingVersion:QCreateVendingVersion,
    }
    private writePanel: WritePanel;
    private readPanel: ReadPanel;


    constructor(router: Router) {
        this.writePanel = new WritePanel(this.vendingVersionQueues);
        this.readPanel = new ReadPanel();
        
        router.post('/zdm8/vending-version/create', APIAdminAccess, this.writePanel.CreateVersion.bind(this.writePanel));

        router.post('/zdm8/vending-version/load-all-version', APIAdminAccess, this.readPanel.LoadAllVersion.bind(this.readPanel));

        QCreateVendingVersion.process((job, done) => {
            const d = job.data;
            const data = d.data;
            this.writePanel._CreateVersion(data).then(r => {
                done(null, r);
            }).catch(error => done(error, null));
        });
    }


}