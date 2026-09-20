export const OFFENDING_OP_ID = 3;
export const FIRST_ATTEMPT_FINAL_STEP = 7;

export const RETRY_OP_IDS = [1, 2, 4, 5] as const;
export const RETRY_FINAL_STEP = RETRY_OP_IDS.length + 1;

export type BundleOpStatus =
  | "pending"
  | "executing"
  | "success"
  | "flagged"
  | "skipped"
  | "reverted"
  | "omitted"
  | "included";

/**
 * The baseline cannot inspect reserve state between operations. Each sub-call
 * appears successful until Monad applies the transaction-level reserve check.
 */
export function baselineStatus(
  operationId: number,
  step: number,
): BundleOpStatus {
  if (step >= FIRST_ATTEMPT_FINAL_STEP) return "reverted";
  if (step === operationId) return "executing";
  if (step > operationId) return "success";
  return "pending";
}

/**
 * MIP-4 still returns one transaction-wide boolean. Checking it after every
 * operation makes the first true result attributable to that operation.
 */
export function mip4Status(
  operationId: number,
  step: number,
): BundleOpStatus {
  if (operationId < OFFENDING_OP_ID) {
    if (step === operationId) return "executing";
    return step > operationId ? "success" : "pending";
  }

  if (operationId === OFFENDING_OP_ID) {
    if (step === operationId) return "executing";
    return step > operationId ? "flagged" : "pending";
  }

  return step > OFFENDING_OP_ID ? "skipped" : "pending";
}

/** The retry is a new bundle with the offending operation omitted. */
export function retryStatus(
  operationId: number,
  step: number,
): BundleOpStatus {
  if (operationId === OFFENDING_OP_ID) return "omitted";

  const retryIndex = RETRY_OP_IDS.indexOf(
    operationId as (typeof RETRY_OP_IDS)[number],
  );

  if (retryIndex === -1) return "pending";
  if (step >= RETRY_FINAL_STEP) return "included";

  const operationStep = retryIndex + 1;
  if (step === operationStep) return "executing";
  if (step > operationStep) return "success";
  return "pending";
}
