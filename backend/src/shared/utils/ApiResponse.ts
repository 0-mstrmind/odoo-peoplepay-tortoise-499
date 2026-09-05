import type { Response } from "express";

const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: Record<string, unknown> | unknown[] = {},
): void => {
  const payload = Array.isArray(data) ? { data } : data;
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    ...payload,
  });
};

export default sendResponse;
