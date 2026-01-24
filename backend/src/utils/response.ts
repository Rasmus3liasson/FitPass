import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api';

export const sendSuccessResponse = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

export const sendErrorResponse = (
  res: Response,
  error: string,
  message?: string,
  statusCode: number = 500
): void => {
  const response: ApiResponse = {
    success: false,
    error,
    message,
  };
  res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  error: string,
  message: string = 'Validation failed'
): void => {
  sendErrorResponse(res, error, message, 400);
};

export const sendNotFoundError = (res: Response, message: string = 'Resource not found'): void => {
  sendErrorResponse(res, 'Not found', message, 404);
};

export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  res.json(response);
};

export const handleControllerError = (
  res: Response,
  error: any,
  context: string = 'Operation'
): void => {
  console.error(`❌ ${context} error:`, error);

  if (error.name === 'ValidationError') {
    sendValidationError(res, error.message);
    return;
  }

  if (error.type === 'StripeCardError') {
    sendErrorResponse(res, error.message, 'Payment error', 400);
    return;
  }

  sendErrorResponse(
    res,
    error.message || `${context} failed`,
    `Failed to complete ${context.toLowerCase()}`
  );
};
