/**
 * Validation utilities for functional error handling.
 *
 * Why validation functions? Eliminates type assertions by validating
 * data shapes and returning Result types. Type-safe JSON parsing.
 */

import { Result, ok, err } from 'neverthrow';

/**
 * Validates and parses JSON response with type safety.
 * Returns Result type instead of throwing or using type assertions.
 */
export const parseJson = <T>(
  json: unknown,
  validator: (data: unknown) => data is T
): Result<T, Error> => {
  if (!validator(json)) {
    return err(new Error('Invalid JSON structure'));
  }
  return ok(json);
};

/**
 * Type guard for checkout response.
 */
const isCheckoutResponse = (data: unknown): data is { url: string } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'url' in data &&
    typeof (data as { url: unknown }).url === 'string'
  );
};

/**
 * Type guard for error response.
 */
const isErrorResponse = (data: unknown): data is { error: string; code: string } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    'code' in data &&
    typeof (data as { error: unknown }).error === 'string' &&
    typeof (data as { code: unknown }).code === 'string'
  );
};

/**
 * Safely parses checkout response JSON.
 */
export const parseCheckoutResponse = (json: unknown): Result<{ url: string }, Error> => {
  return parseJson(json, isCheckoutResponse);
};

/**
 * Safely parses error response JSON.
 */
export const parseErrorResponse = (json: unknown): Result<{ error: string; code: string }, Error> => {
  return parseJson(json, isErrorResponse);
};

/**
 * Type guard for request body with username.
 */
const isUsernameRequestBody = (data: unknown): data is { username?: string } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    (!('username' in data) || typeof (data as { username: unknown }).username === 'string')
  );
};

/**
 * Type guard for request body with credits.
 */
const isCreditsRequestBody = (data: unknown): data is { credits?: number } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    (!('credits' in data) || typeof (data as { credits: unknown }).credits === 'number')
  );
};

/**
 * Safely parses username request body.
 */
export const parseUsernameRequest = (json: unknown): Result<{ username?: string }, Error> => {
  return parseJson(json, isUsernameRequestBody);
};

/**
 * Safely parses credits request body.
 */
export const parseCreditsRequest = (json: unknown): Result<{ credits?: number }, Error> => {
  return parseJson(json, isCreditsRequestBody);
};

/**
 * Type guard for TrustReport.
 */
export const isTrustReport = (data: unknown): data is import('@/types/trust').TrustReport => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    'userInfo' in obj &&
    'score' in obj &&
    'verdict' in obj &&
    'flags' in obj &&
    typeof obj.score === 'number' &&
    typeof obj.verdict === 'string' &&
    Array.isArray(obj.flags)
  );
};

/**
 * Safely parses TrustReport from JSON.
 */
export const parseTrustReport = (json: unknown): Result<import('@/types/trust').TrustReport, Error> => {
  return parseJson(json, isTrustReport);
};

