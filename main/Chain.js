module.exports = class Chain {
  constructor(options) {
    options = options || {};
    Object.assign(this, {
      _beforeHooks: [], _mainHooks: [], _afterHooks: [], _finallyHooks: [],
      duration: 0, yield: {}, createdAt: new Date(), shouldBreak: false
    });
    Object.keys(options).forEach(key => this[key] = options[key]);
  };
  addHook = (type, method) => {
    let { Hook } = require("./");
    this[`_${type}Hooks`].push(new Hook(type, method));
    return this
  };
  before = callback => this.addHook("before", callback);
  main = callback => this.addHook("main", callback);
  after = callback => this.addHook("after", callback);
  finally = callback => this.addHook("finally", callback);
  exec = async () => {
    let stack = [...this._beforeHooks, ...this._mainHooks, ...this._afterHooks];
    await this.#callHooks(stack);
    this.duration = new Date() - this.createdAt;
    await this.#callHooks(this._finallyHooks);
    return this.yield;
  };
  #callHooks = async hookList => {
    for (let i in hookList) {
      let hook = await hookList[i].call();
      if (!hook.success) await this.errorHandler(hook.error);
      if (this.breakOnError && !hook.success) break;
      if (this.shouldBreak) { this.shouldBreak = false; break; }
    };
  };
  errorHandler = async (error) => { };
};
