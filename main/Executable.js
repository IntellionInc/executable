module.exports = class Executable {
  constructor() {
    this._beforeHooks = [];
    this._afterHooks = [];
    this._finallyHooks = [];
    this.yield = { success: true, main: null, errors: [] };
  };
  before = callback => { this._beforeHooks.push(callback); return this; };
  after = callback => { this._afterHooks.push(callback); return this; };
  main = () => this;
  exec = async (...args) => {
    if (await this.#callArray(this._beforeHooks) && !this.yield.success) return this.#finally();
    await this.#callMain(...args);
    await this.#callArray(this._afterHooks);
    return this.#finally();
  };
  #finally = async () => {
    for (let i in this._finallyHooks) await this._finallyHooks[i]();
    return this.yield
  };
  #callArray = async array => {
    for (let i in array) {
      await this.#handledCall(array[i]);
      if (this.yield.success === false) break;
    };
    return true;
  };
  #callMain = async (...args) => {
    this.yield.main = await this.#handledCall(this.main, ...args);
    return true;
  };
  #errorHandler = async error => { this.yield.success = false; this.yield.errors.push(error) };
  #handledCall = async (callback, ...args) => {
    let result = null;
    try {
      result = await callback(...args);
      if (result && result.success === false) { this.#errorHandler(result.error) };
    } catch (error) { this.#errorHandler(error) };
    return result;
  };
};