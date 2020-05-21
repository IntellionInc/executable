let { Assertion, Stub, expect, sinon } = require("@intellion/matchalatte");

class ExecutableAssertion extends Assertion {
  receivesBeforeHook = hookMethod => {
    hookMethod();
    return this;
  };
  whenBeforeHookIsCalled = index => {
    this._obj = this._obj._beforeHooks[index || 0];
    this.args = [];
    return this;
  };
};
class ExecutableStub extends Stub { };

module.exports = {
  expect, sinon,
  Assertion: ExecutableAssertion, Stub: ExecutableStub
};