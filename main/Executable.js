module.exports = class Executable {
  constructor() {
    this._beforeHooks = [];
    this._afterHooks = [];
    this._errors = [];
  };
  before = callback => { this._beforeHooks.push(callback); return this; };
  after = callback => { this._afterHooks.push(callback); return this; };
  main = () => this;
  exec = async options => {
    await this.#callArray(this._beforeHooks);
    let r = await this.main(options);
    await this.#callArray(this._afterHooks);
    return r;
  };
  #callArray = async array => { for (let i in array) await array[i]() };
};