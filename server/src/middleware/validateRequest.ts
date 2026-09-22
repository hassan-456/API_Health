import { Request, Response, NextFunction } from 'express';
import { AppError, CreateEndpointDto, HttpMethod } from '../types';

const VALID_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const validateCreateEndpoint = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { name, url, method, threshold } = req.body as CreateEndpointDto;

  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('API name is required');
  }

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    errors.push('URL is required');
  } else {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('URL must be a valid URL');
    }
  }

  if (!method || !VALID_METHODS.includes(method)) {
    errors.push(`Method must be one of: ${VALID_METHODS.join(', ')}`);
  }

  if (threshold === undefined || threshold === null) {
    errors.push('Response threshold is required');
  } else if (typeof threshold !== 'number' || threshold < 1) {
    errors.push('Threshold must be a positive number (in milliseconds)');
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 400);
  }

  next();
};

export const validateUpdateEndpoint = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { name, url, method, threshold } = req.body;
  const errors: string[] = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push('API name cannot be empty');
  }

  if (url !== undefined) {
    if (typeof url !== 'string' || url.trim().length === 0) {
      errors.push('URL cannot be empty');
    } else {
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          errors.push('URL must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('URL must be a valid URL');
      }
    }
  }

  if (method !== undefined && !VALID_METHODS.includes(method)) {
    errors.push(`Method must be one of: ${VALID_METHODS.join(', ')}`);
  }

  if (threshold !== undefined) {
    if (typeof threshold !== 'number' || threshold < 1) {
      errors.push('Threshold must be a positive number (in milliseconds)');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 400);
  }

  next();
};
