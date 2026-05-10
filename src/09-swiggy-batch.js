/**
 * 🍔 Swiggy Batch Delivery System - Promise.all, Promise.race, Promise.allSettled
 *
 * Swiggy ka batch delivery system banana hai jahan multiple orders ek saath
 * handle hote hain. Promise.all se sab orders ek saath process karo,
 * Promise.race se pehla ready order pakdo, aur Promise.allSettled se
 * mixed results handle karo. Har ek ka apna use case hai!
 *
 * Function: prepareOrder(item, prepTime)
 *   - Returns a new Promise
 *   - Resolves after prepTime milliseconds with:
 *     { item, ready: true, prepTime }
 *   - If item is empty/null/undefined: reject with Error "Item name required!"
 *   - If prepTime <= 0 or not a number: reject with Error "Invalid prep time!"
 *   - Use setTimeout for the delay
 *
 * Function: prepareBatch(items)
 *   - Takes array of { name, prepTime } objects
 *   - Uses Promise.all to prepare ALL items simultaneously
 *   - Calls prepareOrder(item.name, item.prepTime) for each
 *   - Returns Promise resolving with array of prepared items
 *   - If ANY single item fails, the ENTIRE batch fails (Promise.all behavior)
 *   - If items array is empty, resolve with empty array
 *
 * Function: getFirstReady(items)
 *   - Takes array of { name, prepTime } objects
 *   - Uses Promise.race to get the FIRST item that's ready
 *   - Returns Promise resolving/rejecting with the first settled Promise
 *   - If items array is empty, reject with Error "No items to prepare!"
 *
 * Function: prepareSafeBatch(items)
 *   - Takes array of { name, prepTime } objects
 *   - Uses Promise.allSettled to handle ALL outcomes
 *   - Returns Promise resolving with array of results:
 *     Each: { status: "fulfilled", value: preparedItem }
 *     Or:   { status: "rejected", reason: errorMessage }
 *   - Never rejects — always resolves with full results array
 *   - If items array is empty, resolve with empty array
 *
 * Function: deliverWithTimeout(orderPromise, timeoutMs)
 *   - Takes a Promise (orderPromise) and timeout in milliseconds
 *   - Uses Promise.race between orderPromise and a timeout
 *   - If orderPromise resolves first: returns the result
 *   - If timeout fires first: rejects with Error "Delivery timeout!"
 *   - timeoutMs must be > 0, otherwise reject with Error "Invalid timeout!"
 *
 * Function: batchWithRetry(items, maxRetries)
 *   - Tries prepareBatch(items)
 *   - If it fails, retries up to maxRetries times
 *   - Returns result of first successful attempt
 *   - If all attempts fail, throws the last error
 *   - maxRetries must be >= 0 (0 means no retries, just one attempt)
 *   - Each retry is a fresh call to prepareBatch
 *
 * Rules:
 *   - Use Promise.all for prepareBatch (all-or-nothing)
 *   - Use Promise.race for getFirstReady and deliverWithTimeout
 *   - Use Promise.allSettled for prepareSafeBatch (never fails)
 *   - prepareOrder must use actual setTimeout for delays
 *   - batchWithRetry uses sequential retry logic
 *   - Empty arrays should be handled gracefully
 *
 * @example
 *   const item = await prepareOrder("Biryani", 200);
 *   // => { item: "Biryani", ready: true, prepTime: 200 }
 *
 * @example
 *   const batch = await prepareBatch([
 *     { name: "Dosa", prepTime: 100 },
 *     { name: "Idli", prepTime: 50 }
 *   ]);
 *   // => [{ item: "Dosa", ready: true, prepTime: 100 },
 *   //     { item: "Idli", ready: true, prepTime: 50 }]
 *
 * @example
 *   const first = await getFirstReady([
 *     { name: "Dosa", prepTime: 200 },
 *     { name: "Maggi", prepTime: 50 }
 *   ]);
 *   // => { item: "Maggi", ready: true, prepTime: 50 }  (pehle ready hua!)
 *
 * @example
 *   const results = await prepareSafeBatch([
 *     { name: "Pizza", prepTime: 100 },
 *     { name: "", prepTime: 50 }  // invalid item
 *   ]);
 *   // => [{ status: "fulfilled", value: {...} },
 *   //     { status: "rejected", reason: "Item name required!" }]
 */
export function prepareOrder(item, prepTime) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      if (!item || item.length === 0)
        return rej(new Error("Item name required!"));
      if (prepTime <= 0 || isNaN(prepTime))
        return rej(new Error("Invalid prep time!"));
      res({ item, ready: true, prepTime });
    }, prepTime);
  });
}

export function prepareBatch(items) {
  if (items.length === 0) return Promise.resolve([]);
  const allOrders = items.map((item) => prepareOrder(item.name, item.prepTime));
  //allOrders returns an array of promises with the state pending.
  return Promise.all(allOrders);
}

export function getFirstReady(items) {
  if (items.length === 0)
    return Promise.reject(new Error("No items to prepare!"));
  //in the above line, i need to reject using promise instead of throw new Promise, as the Promise.race() below returns a promise object, it is expected that the fucntion should also return promise Object in base case or failure case.
  const allOrders = items.map((item) => prepareOrder(item.name, item.prepTime));
  return Promise.race(allOrders);
}

export async function prepareSafeBatch(items) {
  if (items.length === 0) return Promise.resolve([]);

  const allOrders = items.map((item) => prepareOrder(item.name, item.prepTime));
  const results = await Promise.allSettled(allOrders);

  return results.map((res) => {
    if (res.status === "rejected") {
      return {
        status: "rejected",
        reason: res.reason.message,
      };
    }
    return res;
  });
  // Convert Error object to string message as I need to return errorMessage for reason rather than error object.
  //In general , allSettled returns entire error object.
  //for this I made the function async or i would have used .then/.catch
}

export function deliverWithTimeout(orderPromise, timeoutMs) {
  if (timeoutMs <= 0) return Promise.reject(new Error("Invalid timeout!"));
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Delivery timeout!"));
    }, timeoutMs);
  });
  return Promise.race([orderPromise, timeout]);
}

export async function batchWithRetry(items, maxRetries) {
  //i made function async to implement this
  if (maxRetries < 0 || isNaN(maxRetries))
    throw new Error("No of retries exhausted or input invalid");
  try {
    return await prepareBatch(items);
  } catch (e) {
    if (maxRetries > 0) return await batchWithRetry(items, maxRetries - 1);
    else throw e;
  }
}

// error : unexpected reserved word --> it indicates you forgot to use async before function having await.
