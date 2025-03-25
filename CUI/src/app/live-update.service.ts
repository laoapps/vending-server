import { Injectable } from '@angular/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
@Injectable({
  providedIn: 'root'
})
export class LiveUpdateService {

  constructor() { }


 deleteBundle = async () => {
  await LiveUpdate.deleteBundle({ bundleId: 'my-bundle' });
};

 downloadBundle = async () => {
  await LiveUpdate.downloadBundle({ url: 'https://example.com/1.0.0.zip', bundleId: '1.0.0' });
};

 fetchLatestBundle = async () => {
  // await LiveUpdate.fetchLatestBundle();
};

 getBundles = async () => {
  const result = await LiveUpdate.getBundles();
  return result.bundleIds;
};

 getChannel = async () => {
  const result = await LiveUpdate.getChannel();
  return result.channel;
};

 getCurrentBundle = async () => {
  // const result = await LiveUpdate.getCurrentBundle();
  // return result.bundleId;
};

 getCustomId = async () => {
  const result = await LiveUpdate.getCustomId();
  return result.customId;
};

 getDeviceId = async () => {
  const result = await LiveUpdate.getDeviceId();
  return result.deviceId;
};

 getNextBundle = async () => {
  // const result = await LiveUpdate.getNextBundle();
  // return result.bundleId;
};

 getVersionCode = async () => {
  const result = await LiveUpdate.getVersionCode();
  return result.versionCode;
};

 getVersionName = async () => {
  const result = await LiveUpdate.getVersionName();
  return result.versionName;
};

 ready = async () => {
  await LiveUpdate.ready();
};

 reload = async () => {
  await LiveUpdate.reload();
};

 reset = async () => {
  await LiveUpdate.reset();
};

 setChannel = async () => {
  await LiveUpdate.setChannel({ channel: 'beta' });
};

 setCustomId = async () => {
  await LiveUpdate.setCustomId({ customId: 'my-custom-id' });
};

 setNextBundle = async () => {
  // await LiveUpdate.setNextBundle({ bundleId: '1.0.0' });
};

 sync = async () => {
  const result = await LiveUpdate.sync();
  return result.nextBundleId;
};

 isNewBundleAvailable = async () => {
  // const { bundleId: latestBundleId } = await LiveUpdate.fetchLatestBundle();
  // if (latestBundleId) {
  //   const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle();
  //   return latestBundleId !== currentBundleId;
  // } else {
  //   return false;
  // }
};
}
