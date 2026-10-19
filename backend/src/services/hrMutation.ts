import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { hrMutationReceipts } from "../db/schema/hrAudit";
import type { AuditContext, AuditEventInput } from "../domain/hrAudit";
import { appendHrAudit, type AuditTx } from "./hrAudit";

export class MutationConflictError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = "MutationConflictError";
    this.statusCode = 409;
  }
}

const inFlightMutations = new Map<string, Promise<unknown>>();

/**
 * Execute an HR mutation within a single PostgreSQL transaction together with its receipt.
 * Enforces strict idempotency, prevents duplicate execution on parallel retries,
 * and detects payload tampering (409 Conflict).
 */
export async function runHrMutation<T>(
  context: AuditContext,
  requestHash: string,
  work: (tx: AuditTx) => Promise<T>,
  database: any = db
): Promise<T> {
  const key = `${context.actor.id}:${context.operationId}`;

  // 1. If another call with the same operationId is already in-flight in this process, wait for it
  const existingInFlight = inFlightMutations.get(key);
  if (existingInFlight) {
    try {
      await existingInFlight;
    } catch {
      // In-flight error will be re-evaluated below via receipt check or re-attempt
    }

    // Read the committed receipt from DB and verify hash
    const [receipt] = await database
      .select({
        requestHash: hrMutationReceipts.requestHash,
        response: hrMutationReceipts.response,
      })
      .from(hrMutationReceipts)
      .where(
        and(
          eq(hrMutationReceipts.actorId, BigInt(context.actor.id)),
          eq(hrMutationReceipts.operationId, context.operationId)
        )
      )
      .limit(1);

    if (receipt) {
      if (receipt.requestHash !== requestHash) {
        throw new MutationConflictError(
          `Operation ${context.operationId} was already executed with a different request payload`
        );
      }
      return receipt.response as T;
    }
  }

  // 2. Synchronously register this execution in the in-flight map
  let resolveInFlight!: (val: unknown) => void;
  let rejectInFlight!: (err: unknown) => void;
  const inFlightPromise = new Promise((resolve, reject) => {
    resolveInFlight = resolve;
    rejectInFlight = reject;
  });
  // Prevent unhandledRejection if no concurrent caller attaches to this promise
  inFlightPromise.catch(() => {});
  inFlightMutations.set(key, inFlightPromise);

  try {
    // 3. Check if receipt already exists in DB
    const [existingReceipt] = await database
      .select({
        requestHash: hrMutationReceipts.requestHash,
        response: hrMutationReceipts.response,
      })
      .from(hrMutationReceipts)
      .where(
        and(
          eq(hrMutationReceipts.actorId, BigInt(context.actor.id)),
          eq(hrMutationReceipts.operationId, context.operationId)
        )
      )
      .limit(1);

    if (existingReceipt) {
      if (existingReceipt.requestHash !== requestHash) {
        const conflict = new MutationConflictError(
          `Operation ${context.operationId} was already executed with a different request payload`
        );
        rejectInFlight(conflict);
        throw conflict;
      }
      resolveInFlight(existingReceipt.response);
      return existingReceipt.response as T;
    }

    // 4. Execute work and receipt insert inside the same transaction
    const result = await database.transaction(async (tx: any) => {
      const res = await work(tx);

      await tx.insert(hrMutationReceipts).values({
        actorId: BigInt(context.actor.id),
        operationId: context.operationId,
        requestHash,
        response: res,
      });

      return res;
    });

    resolveInFlight(result);
    return result as T;
  } catch (error: any) {
    const code = error?.code || error?.cause?.code;
    if (code === "23505") {
      // Concurrency race across instances: read committed receipt
      const [savedReceipt] = await database
        .select({
          requestHash: hrMutationReceipts.requestHash,
          response: hrMutationReceipts.response,
        })
        .from(hrMutationReceipts)
        .where(
          and(
            eq(hrMutationReceipts.actorId, BigInt(context.actor.id)),
            eq(hrMutationReceipts.operationId, context.operationId)
          )
        )
        .limit(1);

      if (savedReceipt) {
        if (savedReceipt.requestHash !== requestHash) {
          const conflict = new MutationConflictError(
            `Operation ${context.operationId} was already executed with a different request payload`
          );
          rejectInFlight(conflict);
          throw conflict;
        }
        resolveInFlight(savedReceipt.response);
        return savedReceipt.response as T;
      }
    }
    rejectInFlight(error);
    throw error;
  } finally {
    inFlightMutations.delete(key);
  }
}

/**
 * For failed imports / structural business rejections where the business changes are rolled back,
 * record the failed audit event + mutation receipt in a dedicated, separate transaction.
 */
export async function recordFailedMutation(
  context: AuditContext,
  requestHash: string,
  eventInput: AuditEventInput,
  response: Record<string, unknown>,
  database: any = db
): Promise<void> {
  await database.transaction(async (tx: any) => {
    await appendHrAudit(tx, eventInput);
    await tx.insert(hrMutationReceipts).values({
      actorId: BigInt(context.actor.id),
      operationId: context.operationId,
      requestHash,
      response,
    });
  });
}
