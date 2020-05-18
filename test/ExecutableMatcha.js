let { Assertion, Stub, expect, sinon } = require("@intellion/matchalatte");

class ExecutableAssertion extends Assertion { };
class ExecutableStub extends Stub { };

module.exports = {
  expect, sinon,
  Assertion: ExecutableAssertion, Stub: ExecutableStub
};