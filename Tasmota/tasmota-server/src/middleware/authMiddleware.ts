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

  const isOwnerMode = req.headers["x-owner"] === "true";
  const isAdminMode = req.headers["x-admin-key"] === "super-admin";

  console.log("Mode flags:", { isOwnerMode, isAdminMode });

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const cacheKey = `auth:${token}`; // Only cache UUID, not role
    let uuid: string;

    const cached = await redis.get(cacheKey);
    if (cached) {
      uuid = cached;
      console.log("UUID from cache");
    } else {
      // Validate token and get real UUID
      uuid = await findRealDB(token);
      if (!uuid) {
        return res.status(401).json({ error: "Invalid token or user not found" });
      }
      // Cache only the UUID for 1 hour (fast validation next time)
      await redis.set(cacheKey, uuid, "EX", 3600);
      console.log("UUID validated and cached");
    }

    // === Determine role purely based on flags ===
    let role: "user" | "owner" | "admin" = "user";

    if (isAdminMode) {
      role = "admin";
      console.log("Admin mode activated via x-admin-key");
    } else if (isOwnerMode) {
      role = "owner";
      console.log("Owner mode activated via x-owner: true");
    } else {
      role = "user";
      console.log("Normal user mode (no flags)");
    }

    // Optional: If you still want to auto-create Admin record when entering admin mode
    if (isAdminMode) {
      const admin = await models.Admin.findOne({ where: { uuid } });
      if (!admin) {
        const phoneNumber = await findPhoneNumberByUuid(uuid);
        if (!phoneNumber) {
          return res.status(400).json({ error: "Phone number not found for admin setup" });
        }
        await models.Admin.create({ uuid, phoneNumber } as any);
        console.log("Admin record created");
      }
    }

    // Attach user with dynamically assigned role
    const user = { uuid, role, token };
    res.locals.user = user;

    console.log("Final role assigned:", role);

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
