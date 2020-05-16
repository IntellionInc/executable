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
  exec = async options => {
    if (await this.#callArray(this._beforeHooks) && !this.yield.success) return this.yield;
    await this.#callMain(options);
    await this.#callArray(this._afterHooks);
    return this.yield;
  };
  #callArray = async array => {
    for (let i in array) try {
      let hookResult = await array[i]();
      if (hookResult && hookResult.success === false) { this.#errorHandler(); break; };
    } catch { this.#errorHandler(); break; };
    return true;
  };
  #callMain = async options => {
    try {
      this.yield.main = await this.main(options)
      if (this.yield.main && this.yield.main.success === false) { this.#errorHandler(); }
    } catch { this.#errorHandler() };
    return true;
  };
  #errorHandler = async e => this.yield.success = false;
};