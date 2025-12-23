/**
 * Functional fetch utilities using Result types.
 *
 * Why separate fetch utilities? Eliminates try/catch in components,
 * provides type-safe error handling, and keeps side effects isolated.
 */

import { Result, ok, err } from 'neverthrow';
import { parseCheckoutResponse, parseErrorResponse, parseTrustReport } from './validation';
import type { TrustReport } from '@/types/trust';

/**
 * Fetches JSON response and handles errors functionally.
 *
 * Note: response.json() can throw, but we catch and convert to Result.
 * This is the boundary where exceptions enter our functional world.
 */
const fetchJson = async (response: Response): Promise<Result<unknown, Error>> => {
  try {
    const json = await response.json();
    return ok(json);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Failed to parse JSON response'));
  }
};

/**
 * Creates checkout session via API.
 * Returns Result type for functional error handling.
 *
 * Note: fetch() can throw (network errors), but we catch and convert to Result.
 * This is the boundary where exceptions enter our functional world.
 */
export const createCheckoutSession = async (credits: number): Promise<Result<{ url: string }, Error>> => {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credits }),
    });

    if (!response.ok) {
      const jsonResult = await fetchJson(response);

      if (jsonResult.isErr()) {
        return err(new Error(`HTTP ${response.status}: Failed to parse error response`));
      }

      const errorResult = parseErrorResponse(jsonResult.value);
      if (errorResult.isErr()) {
        return err(new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      return err(new Error(errorResult.value.error));
    }

    const jsonResult = await fetchJson(response);
    if (jsonResult.isErr()) {
      return err(jsonResult.error);
    }

    return parseCheckoutResponse(jsonResult.value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Network error'));
  }
};

/**
 * Verifies Twitter account via API.
 * Returns Result type for functional error handling.
 *
 * Note: fetch() can throw (network errors), but we catch and convert to Result.
 * This is the boundary where exceptions enter our functional world.
 */
export const verifyAccount = async (username: string): Promise<Result<TrustReport, Error>> => {
  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const jsonResult = await fetchJson(response);

      if (jsonResult.isErr()) {
        return err(new Error(`HTTP ${response.status}: Failed to parse error response`));
      }

      const errorResult = parseErrorResponse(jsonResult.value);
      if (errorResult.isErr()) {
        return err(new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      const errorData = errorResult.value;

      // Map error codes to user-friendly messages
      if (errorData.code === 'INSUFFICIENT_CREDITS') {
        return err(new Error('INSUFFICIENT_CREDITS'));
      }
      if (errorData.code === 'ACCOUNT_NOT_FOUND') {
        return err(new Error('ACCOUNT_NOT_FOUND'));
      }
      if (errorData.code === 'AUTH_REQUIRED' || errorData.code === 'UNAUTHORIZED') {
        return err(new Error('AUTH_REQUIRED'));
      }

      return err(new Error(errorData.error));
    }

    const jsonResult = await fetchJson(response);
    if (jsonResult.isErr()) {
      return err(jsonResult.error);
    }

    return parseTrustReport(jsonResult.value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Network error'));
  }
};

