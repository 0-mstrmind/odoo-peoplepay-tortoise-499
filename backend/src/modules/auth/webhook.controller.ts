import type { Request, Response } from "express";
import { Webhook } from "svix";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../../core/config/prisma.js";
import { env } from "../../core/config/env.js";
import { logger } from "../../core/config/logger.js";

export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.warn("Clerk webhook secret not configured");
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Webhook secret missing" });
    return;
  }

  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing Svix headers" });
    return;
  }

  const payload = req.body;
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    logger.error("Error verifying Clerk webhook signature:", err);
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Webhook signature verification failed" });
    return;
  }

  const eventType = evt.type;
  logger.info(`Clerk Webhook received event: ${eventType}`);

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id: clerkUserId, email_addresses, primary_email_address_id } = evt.data;
    const primaryEmailObj = email_addresses?.find((e: any) => e.id === primary_email_address_id);
    const email = primaryEmailObj?.email_address || email_addresses?.[0]?.email_address;

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ clerkUserId }, { email }], deletedAt: null },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            clerkUserId,
            email,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.user.create({
          data: {
            clerkUserId,
            email,
            role: "employee",
            isActive: true,
          },
        });
      }
    }
  } else if (eventType === "user.deleted") {
    const { id: clerkUserId } = evt.data;
    await prisma.user.updateMany({
      where: { clerkUserId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  res.status(StatusCodes.OK).json({ success: true, eventType });
};
