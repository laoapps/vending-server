import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { findUuidByPhoneNumberOnUserManager } from '../services/userManagerService';
import { env } from '../config/env';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  try {
    const userData = await findUuidByPhoneNumberOnUserManager(phoneNumber);
    if (!userData) {
      return res.status(401).json({ error: 'Invalid phone number' });
    }

    let owner = await prisma.owner.findUnique({ where: { uuid: userData.uuid } });
    let admin = await prisma.admin.findUnique({ where: { uuid: userData.uuid } });

    const role = admin ? 'admin' : owner ? 'owner' : 'user';
    const token = jwt.sign({ uuid: userData.uuid, role }, env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const registerOwner = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  try {
    const userData = await findUuidByPhoneNumberOnUserManager(phoneNumber);
    if (!userData) {
      return res.status(401).json({ error: 'Invalid phone number' });
    }

    const existingOwner = await prisma.owner.findUnique({ where: { uuid: userData.uuid } });
    if (existingOwner) {
      return res.status(400).json({ error: 'Owner already registered' });
    }

    const owner = await prisma.owner.create({
      data: { uuid: userData.uuid, phoneNumber },
    });

    const token = jwt.sign({ uuid: userData.uuid, role: 'owner' }, env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, owner });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};