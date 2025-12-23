import WebSocket from 'ws';


import { Notification } from '../models/notification';
import { Order } from '../models/order';
import models from '../models';

export const userClients: Map<string, Set<{WebSocket:WebSocket,uuid:string}>> = new Map();
export const adminClients: Set<{WebSocket:WebSocket,uuid:string}> = new Set();
export const ownerClients: Map<number, Set<{WebSocket:WebSocket,uuid:string}>> = new Map();

export const notifyStakeholders = async (order?: Order, message?: string) => {
  if(!order) {
    console.log('Order not found');
    return;
  }
  const device = await models.Device.findByPk(order?.dataValues?.deviceId);
  if (!device) {
    console.log('Device not found');
 return;
  }
   

  const owner = await models.Owner.findByPk(device.dataValues.ownerId);
    if (!owner) {
    console.log('Owner not found');
 return;
  }
  const notification = {
    message,
    orderId: order.dataValues.id,
    deviceId: order.dataValues.deviceId,
    userUuid: order.dataValues.userUuid,
    ownerId: owner.dataValues.id,
    timestamp: new Date().toISOString(),
  };

  const json = JSON.stringify(notification);

  // Send to user
  if (userClients.has(order.dataValues.userUuid)) {
    for (const ws of userClients.get(order.dataValues.userUuid)||[]) {
      if (ws.WebSocket.readyState === WebSocket.OPEN) {
        ws.WebSocket.send(json);
      }
    }
  }

  // Send to admin
  for (const ws of adminClients) {
    if (ws.WebSocket.readyState === WebSocket.OPEN) {
      ws.WebSocket.send(json);
    }
  }


  // Send to owner
  if(Number.isInteger(owner.dataValues.id)){
    if (ownerClients.has(owner.dataValues.id||-1000)) {
      for (const ws of ownerClients.get(owner.dataValues.id||-1000)||[]) {
        if (ws.WebSocket.readyState === WebSocket.OPEN) {
          ws.WebSocket.send(json);
        }
      }
    }
  }
  

  // Record to Notification table
  await Notification.create({
    type: 'order_event',
    content: notification,
    userUuid: order.dataValues.userUuid,
    ownerId: owner.dataValues.id,
    adminNotified: true, // Assuming admins are always notified; adjust as needed
  } as any);
};