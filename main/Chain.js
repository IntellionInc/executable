module.exports = class Chain {
  constructor(options) {
    options = options || {};
    this._beforeHooks = [];
    this._mainHooks = [];
    this._afterHooks = [];
    this._finallyHooks = [];
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
    await this.#callHooks(this._finallyHooks);
  };
  #callHooks = async hookList => {
    for (let i in hookList) {
      let hook = await hookList[i].call();
      if (this.breakOnError && !hook.success) break;
    };
  };
};
