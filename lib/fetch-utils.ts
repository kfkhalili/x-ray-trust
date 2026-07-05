/**
 * Functional fetch utilities using Result types.
 *
 * Why separate fetch utilities? Eliminates try/catch in components,
 * provides type-safe error handling, and keeps side effects isolated.
 */

import { Result, ok, err } from "neverthrow";
import { parseErrorResponse, parseTrustReport } from "./validation";
import type { TrustReport } from "@/types/trust";

/**
 * Fetches JSON response and handles errors functionally.
 *
 * Note: response.json() can throw, but we catch and convert to Result.
 * This is the boundary where exceptions enter our functional world.
 */
const fetchJson = async (
  response: Response
): Promise<Result<unknown, Error>> => {
  try {
    const json = await response.json();
    return ok(json);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error("Failed to parse JSON response")
    );
  }
};

/**
 * Verifies an X account via the API.
 * Returns Result type for functional error handling.
 *
 * On an HTTP error the Result carries the server's error *code*
 * (e.g. "ACCOUNT_NOT_FOUND", "RATE_LIMIT_EXCEEDED", "UPSTREAM_ERROR",
 * "SERVER_ERROR") so the UI can map it to a friendly message.
 */
export const verifyAccount = async (
  username: string
): Promise<Result<TrustReport, Error>> => {
  try {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const jsonResult = await fetchJson(response);
      if (jsonResult.isErr()) {
        return err(
          new Error(`HTTP ${response.status}: Failed to parse error response`)
        );
      }

      const errorResult = parseErrorResponse(jsonResult.value);
      if (errorResult.isErr()) {
        return err(new Error(`HTTP ${response.status}: ${response.statusText}`));
      }

      // Surface the code so the UI can map it to a specific message.
      return err(new Error(errorResult.value.code || errorResult.value.error));
    }

    const jsonResult = await fetchJson(response);
    if (jsonResult.isErr()) {
      return err(jsonResult.error);
    }

    return parseTrustReport(jsonResult.value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error("Network error"));
  }
};
