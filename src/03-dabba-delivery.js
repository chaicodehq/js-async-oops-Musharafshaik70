/**
 * 🍱 Mumbai ka Dabbawala Service - ES6 Classes
 *
 * Mumbai ke famous dabbawala system ko ab modern ES6 class mein likho!
 * Har din hazaaron dabbas deliver hote hain aur ek bhi galat nahi jaata.
 * Tumhe DabbaService class banana hai jo customers manage kare, delivery
 * batches banaye, aur daily reports generate kare.
 *
 * Class: DabbaService
 *
 *   constructor(serviceName, area)
 *     - this.serviceName = serviceName
 *     - this.area = area
 *     - this.customers = [] (internal array)
 *     - this._nextId = 1 (auto-increment counter)
 *
 *   addCustomer(name, address, mealPreference)
 *     - mealPreference must be one of: "veg", "nonveg", "jain"
 *     - Agar invalid preference, return null
 *     - Agar name already exists (duplicate), return null
 *     - Creates customer: { id: auto-increment, name, address, mealPreference,
 *       active: true, delivered: false }
 *     - Pushes to this.customers
 *     - Returns the customer object
 *
 *   removeCustomer(name)
 *     - Sets customer's active to false (soft delete)
 *     - Returns true if found and deactivated
 *     - Returns false if not found or already inactive
 *
 *   createDeliveryBatch()
 *     - Returns array of delivery objects for all ACTIVE customers
 *     - Each delivery: { customerId: id, name, address, mealPreference,
 *       batchTime: new Date().toISOString() }
 *     - Resets delivered to false for all active customers before creating batch
 *     - Returns empty array if no active customers
 *
 *   markDelivered(customerId)
 *     - Finds active customer by id, sets delivered to true
 *     - Returns true if found and marked
 *     - Returns false if not found or not active
 *
 *   getDailyReport()
 *     - Returns report object for ACTIVE customers only:
 *       {
 *         totalCustomers: number (active only),
 *         delivered: number (active and delivered === true),
 *         pending: number (active and delivered === false),
 *         mealBreakdown: { veg: count, nonveg: count, jain: count }
 *       }
 *     - mealBreakdown counts active customers only
 *
 *   getCustomer(name)
 *     - Returns customer object by name (including inactive)
 *     - Returns null if not found
 *
 * Rules:
 *   - Use ES6 class syntax (not constructor functions)
 *   - Customer ids auto-increment starting from 1
 *   - No duplicate customer names allowed
 *   - removeCustomer is a soft delete (active: false), not actual removal
 *   - getDailyReport only counts active customers
 *   - mealPreference must be exactly "veg", "nonveg", or "jain"
 *
 * @example
 *   const service = new DabbaService("Raju Dabba", "Dadar");
 *   service.addCustomer("Amit", "Andheri West", "veg");
 *   // => { id: 1, name: "Amit", address: "Andheri West", mealPreference: "veg", active: true, delivered: false }
 *   service.addCustomer("Priya", "Bandra East", "jain");
 *   // => { id: 2, ... }
 *   service.createDeliveryBatch();
 *   // => [{ customerId: 1, name: "Amit", ... }, { customerId: 2, name: "Priya", ... }]
 *   service.markDelivered(1);       // => true
 *   service.getDailyReport();
 *   // => { totalCustomers: 2, delivered: 1, pending: 1, mealBreakdown: { veg: 1, nonveg: 0, jain: 1 } }
 */
export class DabbaService {
  constructor(serviceName, area) {
    this.serviceName = serviceName;
    this.area = area;
    this.customers = [];
    this._nextId = 1;
    //this._nextId++;
  }

  addCustomer(name, address, mealPreference) {
    const meal = mealPreference.toLowerCase();
    if (meal !== "veg" && meal !== "nonveg" && meal !== "jain") return null;
    const isCustomer = this.customers.some(
      (customer) => customer.name === name,
    );
    if (isCustomer) return null;
    const customer = {
      id: this._nextId++,
      name,
      address,
      mealPreference,
      active: true,
      delivered: false,
    };
    this.customers.push(customer);
    return customer;
  }

  removeCustomer(name) {
    const isCustomer = this.customers.find(
      (customer) => customer.name === name,
    );
    if (!isCustomer || isCustomer.active === false) {
      return false;
    }
    isCustomer.active = false;
    return true;
  }

  createDeliveryBatch() {
    const activeCustomers = this.customers
      .map((c) => ({ delivered: false, ...c }))
      .filter((c) => c.active);
    if (activeCustomers.length === 0) return [];
    return activeCustomers.map((c) => ({
      customerId: c.id,
      name: c.name,
      address: c.address,
      mealPreference: c.mealPreference,
      batchTime: new Date().toISOString(),
    }));
  }

  markDelivered(customerId) {
    const activeCustomerById = this.customers.find((c) => c.id === customerId);
    if (activeCustomerById) {
      activeCustomerById.delivered = true;
      return true;
    }
    return false;
  }

  getDailyReport() {
    const activeCustomers = this.customers.filter((c) => c.active);
    const totalCustomers = activeCustomers.length;
    const delivered = activeCustomers.filter((c) => c.delivered).length;
    const pending = totalCustomers - delivered;
    const mealBreakdown = activeCustomers.reduce(
      (acc, c) => {
        acc[c.mealPreference] = acc[c.mealPreference] + 1;
        return acc;
      },
      { veg: 0, nonveg: 0, jain: 0 },
    );
    return { totalCustomers, delivered, pending, mealBreakdown };
  }

  getCustomer(name) {
    const reqCustomer = this.customers.find(
      (customer) => customer.name === name,
    );
    if (!reqCustomer) return null;
    return reqCustomer;
  }
}



//cannot do autoincrement on numbers while initializing ex: a = 1++ ; its not allowed.