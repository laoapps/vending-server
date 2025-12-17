import { Request, Response, NextFunction } from "express";
import {
  findPhoneNumberByUuid,
  findRealDB,
  validateHMVending,
} from "../services/userManagerService";
import models from "../models";
import redis from "../config/redis";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const adminKey = req.headers["x-admin-key"] as string | undefined;
  const isOwnerFunction = req.headers["x-owner"] === "true"; // Keep this — used for route protection

  console.log("isOwnerFunction:", isOwnerFunction);
  console.log("adminKey:", adminKey);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const cacheKey = `user:${token}`;
    let cachedData = await redis.get(cacheKey);

    let user: { uuid: string; role: "user" | "owner" | "admin"; token: string };

    if (cachedData) {
      user = JSON.parse(cachedData);
      console.log("User from cache:", { uuid: user.uuid, role: user.role });
    } else {
      // Validate token and get real UUID
      const uuid = await findRealDB(token);
      if (!uuid) {
        return res.status(401).json({ error: "Invalid token or user not found" });
      }

      let role: "user" | "owner" | "admin" = "user";

      // Highest priority: super-admin key → force admin role + ensure record exists
      if (adminKey === "super-admin") {
        const admin = await models.Admin.findOne({ where: { uuid } });
        if (!admin) {
          const phoneNumber = await findPhoneNumberByUuid(uuid);
          if (!phoneNumber) {
            return res.status(400).json({ error: "Phone number not found for admin creation" });
          }
          await models.Admin.create({ uuid, phoneNumber } as any);
        }
        role = "admin";
      }
      // Next: check if user is owner
      else {
        const owner = await models.Owner.findOne({ where: { uuid } });
        if (owner) {
          role = "owner";
        }
        // else remains "user"
      }

      user = { uuid, role, token };

      // Cache the correct role for 1 hour
      await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);
      console.log("User cached with role:", role);
    }

    // === Critical Fix: Enforce owner requirement if route demands it ===
    if (isOwnerFunction) {
      if (user.role !== "owner" && user.role !== "admin") {
        return res.status(403).json({ error: "Owner access required for this endpoint" });
      }
      console.log("Owner-only route: Access granted (role =", user.role, ")");
    }

    // Attach authenticated user to request
    res.locals.user = user;

    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const authHMVending = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["token"];
  // const machineId = req.headers['machineid'];
  // const otp = req.headers['otp'];
  // console.log('authHMVending',machineId,otp);
  console.log("authHMVending", token);

  if (!token) {
    res.status(401).json({ error: "Invalid parameters" });
    return;
  }
  // if (!machineId || !otp) {
  //   res.status(401).json({ error: 'Invalid parameters' });
  //   return;
  // }
  // const ownerUuid = await validateHMVending(machineId + '', otp + '');
  const ownerUuid = await validateHMVending(token + "");

  if (!ownerUuid) {
    res.status(401).json({ error: "Invalid onwerUuid" });
    return;
  }
  try {
    // Check Redis cache
    const cacheKey = `owner:${ownerUuid}`;
    const cachedData = await redis.get(cacheKey);
    let user: { uuid: string; role: string };

    if (cachedData) {
      user = JSON.parse(cachedData);
    } else {
      const phoneNumber = await findPhoneNumberByUuid(ownerUuid);
      if (!phoneNumber) {
        res.status(401).json({ error: "Invalid ownerUuid or user not found" });
        return;
      }

      const owner = await models.Owner.findOne({ where: { uuid: ownerUuid } });
      console.log("owner", owner);
      if (!owner) {
        res.status(401).json({ error: " owner not found" });

        return;
      }
      let role = "owner";
      // Admin verification
      user = { uuid: ownerUuid, role };
      // Cache for 60 minutes (3600 seconds)
      await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);
    }
    res.locals.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid ownerUuid" });
  }
};
