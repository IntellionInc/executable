let { Assertion, Stub, expect, sinon } = require("@intellion/matchalatte");

class ExecutableAssertion extends Assertion {
  receivesHook = hookMethod => {
    hookMethod();
    return this;
  };
  whenHookIsCalled = (type, index) => {
    this._obj = this._obj[`_${type}Hooks`][index || 0];
    this.args = [];
    return this;
  };
  toHaveHook = (type, method) => {
    let matchingHooks = this._obj[`_${type}Hooks`].filter(hook => hook.method === method);
    expect(matchingHooks).to.have.lengthOf(1);
    return this;
  };
};
class ExecutableStub extends Stub { };

module.exports = {
  expect, sinon,
  Assertion: ExecutableAssertion, Stub: ExecutableStub
};