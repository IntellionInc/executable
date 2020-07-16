const { Assertion, Stub, expect, sinon } = require("./ExecutableMatcha");
const { Chain, Hook } = require("../main");
const main = require("../main");

describe("Chain", () => {
  let chain, options, clock;
  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date("01/01/1999"));
    chain = new Chain(options);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe("constructor", () => {
    context("when options object is provided", () => {
      before(() => { options = { some: "options" } })
      it("should create a chain object", () => new Assertion(chain)
        .toLooselyHaveProperties({ _beforeHooks: [], _mainHooks: [], _afterHooks: [], _finallyHooks: [], yield: {}, ...options, duration: 0, createdAt: new Date("01/01/1999") }));
    });
    context("when no options are passed in", () => {
      before(() => { options = undefined });
      it("should create a chain object", () => new Assertion(chain)
        .toLooselyHaveProperties({ _beforeHooks: [], _mainHooks: [], _afterHooks: [], _finallyHooks: [] }));
    });
  });
  describe("addHook", () => {
    let type = "before", method = () => { };
    let hook = { some: "hook" };
    beforeEach(() => {
      new Stub(main).receives("Hook").new().with(type, method).andReturns(hook);

    })
    it("should add a hook to the designated array and return this", () => new Assertion(chain.addHook)
      .whenCalledWith(type, method).should(r => expect(chain._beforeHooks).to.include(hook)).return(chain));
  });
  describe("hookShortcuts", () => {
    let callback = () => { };
    ["before", "after", "main", "finally"].forEach(hookType => {
      describe(hookType, () => {
        beforeEach(() => {
          new Stub(chain).receives("addHook").with(hookType, callback).andReturns(chain);
        });
        it("should return addHook response", () => new Assertion(chain[hookType])
          .whenCalledWith(callback).should().return(chain));
      });
    });
  });
  describe("exec", () => {
    let errorHandler, error = new Error("something"), duration = 24 * 60 * 60 * 1000;
    let addStubbedHooks = (type, count, result, notCalled) => {
      for (let i = 0; i < count; i++) {
        let hook = {};
        if (result.success === false) errorHandler.with(error).andResolves("errorHandlerResult");
        if (notCalled) new Stub(hook).doesnt().receive("call");
        else {
          let stubbedHook = new Stub(hook).receives("call").with()
          stubbedHook.andResolves(result);
        };
        chain[`_${type}Hooks`].push(hook);
      };
    };
    let addSuccessfulHooks = (type, count) => addStubbedHooks(type, count, { success: true });
    let addUnsuccessfulHooks = (type, count) => addStubbedHooks(type, count, { success: false, error });
    let addUncalledHooks = (type, count) => addStubbedHooks(type, count, { called: false }, true);
    let yield = { some: "result" };
    beforeEach(() => {
      chain.yield = yield;
      errorHandler = new Stub(chain).receives("errorHandler");
      clock.tick(duration);
    });
    afterEach(() => {
      expect(chain.duration).to.eq(duration);
    });
    context("when all hooks are successful", () => {
      beforeEach(() => {
        addSuccessfulHooks("before", 2);
        addSuccessfulHooks("main", 4);
        addSuccessfulHooks("after", 2);
        addSuccessfulHooks("finally", 3);
      });
      it("should call all hooks", () => new Assertion(chain.exec)
        .whenCalledWith().should().resolve(yield));
    });
    context("when some hooks return unsuccessful response", () => {
      context("when breakOnError is set to false", () => {
        before(() => options = { breakOnError: false });
        beforeEach(() => {
          addUnsuccessfulHooks("before", 2);
          addUnsuccessfulHooks("main", 4);
          addUnsuccessfulHooks("after", 2);
          addUnsuccessfulHooks("finally", 3);
        });
        it("should call all hooks", () => new Assertion(chain.exec)
          .whenCalledWith().should().resolve(yield));
      });
      context("when breakOnError is set to true", () => {
        before(() => options = { breakOnError: true });
        beforeEach(() => {
          addSuccessfulHooks("before", 2);
          addUnsuccessfulHooks("before", 1);
          addUncalledHooks("main", 4);
          addUncalledHooks("after", 2);
          addSuccessfulHooks("finally", 2);
          addUnsuccessfulHooks("finally", 1);
          addUncalledHooks("finally", 1);
        });
        it("should stop execution after the failed hook", () => new Assertion(chain.exec)
          .whenCalledWith().should().resolve(yield));
      });
    });
    context("when shouldBreak is triggered", () => {
      before(() => options = { breakOnError: false });
      beforeEach(() => {
        addSuccessfulHooks("before", 2);
        let hook = { success: true };
        new Stub(hook).receives("call").executes(async () => {
          chain.shouldBreak = true;
          return hook;
        });
        chain._beforeHooks.push(hook);
        addUncalledHooks("before", 1);
        addUncalledHooks("main", 4);
        addUncalledHooks("after", 2);
        addSuccessfulHooks("finally", 2);
        addUnsuccessfulHooks("finally", 1);
      });
      it("should stop execution after the breaking hook", () => new Assertion(chain.exec)
        .whenCalledWith().should().resolve(yield));
    });
  });
});