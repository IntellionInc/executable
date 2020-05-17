module.exports = class Executable {
  constructor() {
    this._beforeHooks = [];
    this._afterHooks = [];
    this._errors = [];
    this.yield = { success: true, main: null };
  };
  before = callback => { this._beforeHooks.push(callback); return this; };
  after = callback => { this._afterHooks.push(callback); return this; };
  main = () => this;
  exec = async (...args) => {
    if (await this.#callArray(this._beforeHooks) && !this.yield.success) return this.yield;
    await this.#callMain(...args);
    await this.#callArray(this._afterHooks);
    return this.yield;
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
  #errorHandler = async e => this.yield.success = false;
  #handledCall = async (callback, ...args) => {
    let result = null;
    try {
      result = await callback(...args);
      if (result && result.success === false) { this.#errorHandler() };
    } catch { this.#errorHandler() };
    return result;
  };
};