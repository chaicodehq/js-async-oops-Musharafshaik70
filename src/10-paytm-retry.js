/**
 * 💳 Paytm Payment System - Error Handling: try/catch, Custom Errors, Retry
 *
 * Paytm payment system mein transactions fail ho sakti hain — balance kam,
 * network issue, ya fraud detected! Custom error classes banao taaki har
 * error type ko alag handle kar sako. Retry logic se network errors pe
 * dubara try karo, lekin fraud pe turant band karo.
 *
 * Custom Error Classes (all extend Error or PaymentError):
 *
 *   PaymentError extends Error
 *     - constructor(message, code, amount)
 *     - this.name = "PaymentError"
 *     - this.code = code (string error code)
 *     - this.amount = amount (transaction amount)
 *
 *   InsufficientFundsError extends PaymentError
 *     - constructor(amount, balance)
 *     - message: "Insufficient funds: need ${amount}, have ${balance}"
 *     - code: "INSUFFICIENT_FUNDS"
 *     - this.name = "InsufficientFundsError"
 *     - this.balance = balance
 *
 *   NetworkError extends PaymentError
 *     - constructor(amount)
 *     - message: "Network error during transaction"
 *     - code: "NETWORK_ERROR"
 *     - this.name = "NetworkError"
 *     - this.retryable = true
 *
 *   FraudDetectedError extends PaymentError
 *     - constructor(amount)
 *     - message: "Suspicious transaction detected"
 *     - code: "FRAUD_DETECTED"
 *     - this.name = "FraudDetectedError"
 *     - this.retryable = false
 *
 *
 * Function: processPayment(amount, balance, networkStatus)
 *   - async function
 *   - Validates and throws appropriate custom errors:
 *     - If amount is not a positive number: throw PaymentError("Invalid amount", "INVALID_AMOUNT", amount)
 *     - If amount > balance: throw new InsufficientFundsError(amount, balance)
 *     - If networkStatus === "offline": throw new NetworkError(amount)
 *     - If amount > 100000: throw new FraudDetectedError(amount)
 *   - If all valid: return {
 *       transactionId: "TXN" + Math.floor(Math.random() * 1000000),
 *       amount,
 *       status: "success",
 *       timestamp: new Date().toISOString()
 *     }
 *   - Simulate small delay (~50ms)
 *
 * Function: retryPayment(paymentFn, maxRetries, delayMs)
 *   - async function
 *   - paymentFn is a function that returns a Promise (like () => processPayment(...))
 *   - Calls paymentFn. If it succeeds, return result.
 *   - If it fails with NetworkError: retry up to maxRetries times
 *     Wait delayMs between each retry
 *   - If it fails with any OTHER error: re-throw immediately (no retry)
 *   - If all retries exhausted: throw the last NetworkError
 *   - maxRetries must be >= 0, delayMs must be > 0
 *
 * Function: processWithFallback(primaryFn, fallbackFn)
 *   - async function
 *   - Tries primaryFn() first
 *   - If it succeeds: return result
 *   - If it fails: try fallbackFn()
 *   - If fallback succeeds: return its result
 *   - If both fail: throw new PaymentError(
 *       "Primary: ${primaryError.message}, Fallback: ${fallbackError.message}",
 *       "BOTH_FAILED", 0)
 *
 * Function: categorizeError(error)
 *   - Synchronous function (not async)
 *   - Takes an error object and returns a categorization:
 *   - If error instanceof InsufficientFundsError:
 *     { type: "insufficient_funds", retryable: false, message: error.message }
 *   - If error instanceof NetworkError:
 *     { type: "network", retryable: true, message: error.message }
 *   - If error instanceof FraudDetectedError:
 *     { type: "fraud", retryable: false, message: error.message }
 *   - Otherwise:
 *     { type: "unknown", retryable: false, message: error.message || "Unknown error" }
 *
 * Rules:
 *   - Custom errors must properly extend their parent class
 *   - Always use `super()` in error constructors
 *   - instanceof checks must work correctly through the hierarchy
 *   - retryPayment ONLY retries NetworkError, everything else re-throws
 *   - processPayment checks conditions in order: invalid amount, insufficient funds,
 *     network, fraud — first matching condition triggers
 *   - Delay between retries should use actual setTimeout/Promise delay
 *
 * @example
 *   try {
 *     await processPayment(500, 100, "online");
 *   } catch (e) {
 *     console.log(e instanceof InsufficientFundsError); // true
 *     console.log(e.code);    // "INSUFFICIENT_FUNDS"
 *     console.log(e.balance); // 100
 *   }
 *
 * @example
 *   const result = await retryPayment(
 *     () => processPayment(100, 500, "online"),
 *     3, 100
 *   );
 *   // => { transactionId: "TXN...", amount: 100, status: "success", ... }
 *
 * @example
 *   categorizeError(new NetworkError(500));
 *   // => { type: "network", retryable: true, message: "Network error during transaction" }
 */
export class PaymentError extends Error {
  constructor(message, code, amount) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.amount = amount;
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(amount, balance) {
    super(
      `Insufficient funds: need ${amount}, have ${balance}`,
      "INSUFFICIENT_FUNDS",
      amount,
    );
    this.name = "InsufficientFundsError";
    this.balance = balance;
  }
}

export class NetworkError extends PaymentError {
  constructor(amount) {
    super(`Network error during transaction`, "NETWORK_ERROR", amount);
    this.name = "NetworkError";
    this.retryable = true;
  }
}

export class FraudDetectedError extends PaymentError {
  constructor(amount) {
    super("Suspicious transaction detected", "FRAUD_DETECTED", amount);
    this.name = "FraudDetectedError";
    this.retryable = false;
  }
}

export async function processPayment(amount, balance, networkStatus) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (amount < 0)
    throw new PaymentError("Invalid amount", "INVALID_AMOUNT", amount);
  if (amount > balance) throw new InsufficientFundsError(amount, balance);
  if (networkStatus === "offline") throw new NetworkError(amount);
  if (amount > 100000) throw new FraudDetectedError(amount);
  return {
    transactionId: "TXN" + Math.floor(Math.random() * 1000000),
    amount,
    status: "success",
    timestamp: new Date().toISOString(),
  };
}

export async function retryPayment(paymentFn, maxRetries, delayMs) {
  if (maxRetries < 0 || delayMs <= 0)
    throw new Error("Retries exhausted or delaytime not valid");
  try {
    return await paymentFn();
  } catch (e) {
    if (e.name === "NetworkError" && maxRetries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return await retryPayment(paymentFn, maxRetries - 1, delayMs);
    } else throw e;
  }
}

export async function processWithFallback(primaryFn, fallbackFn) {
  try {
    return await primaryFn();
  } catch (primaryError) {
    try {
      return await fallbackFn();
    } catch (fallbackError) {
      throw new PaymentError(
        `Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`,
        "BOTH_FAILED",
        0,
      );
    }
  }
}

export function categorizeError(error) {
  if (error instanceof InsufficientFundsError)
    return {
      type: "insufficient_funds",
      retryable: false,
      message: error.message,
    };
  if (error instanceof NetworkError)
    return { type: "network", retryable: true, message: error.message };
  if (error instanceof FraudDetectedError)
    return { type: "fraud", retryable: false, message: error.message };
  return {
    type: "unknown",
    retryable: false,
    message: error.message || "Unknown error",
  };
}

//setTimeout does not work inside an async function to "pause" execution. You need a Promise-based delay. If I simply write setTimeout inside an async function, then I use await to get the result(async function always returns promise, so we use await) the promise state changes to fumfilled but we dont't get data or result. why ?
//This is beacuase when the function sees the setTimout it registers in the webApi and considers it has executed the code and changes its state to fulfilled. then the callback inside the setTimeout will be executed aftet the timer hits 0.
// How to solve this ?
// Either wrap the setTimout inside promise(not good)
// or
//do :   await new Promise((resolve) => setTimeout(resolve, 50)); --> keeps code clean and understandable.

//It is good practice to prefer for loop over recursion as we add new stuff into callstack each time when using recursion.

/* 
export async function retryPayment(paymentFn, maxRetries, delayMs) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await paymentFn();
    } catch (e) {
      // If it's a network error and we haven't reached the limit yet
      if (e.name === "NetworkError" && i < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      throw e; // Throw if it's a different error OR we're out of retries
    }
  }
}
*/
