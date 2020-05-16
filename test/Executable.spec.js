const { Assertion, expect, Stub, sinon } = require("@intellion/matchalatte");
const Executable = require("../main/Executable");

describe("Executable", () => {
  let executable;
  beforeEach(() => {
    executable = new Executable();
  });
  describe("constructor", () => {
    it("should create an executable instance", () => {
      new Assertion(executable).toLooselyHaveProperties({
        _beforeHooks: [], _afterHooks: [], _errors: [],
        yield: { success: true }
      });
    });
  });
  ["before", "after"].forEach(hookType => {
    context(`${hookType}`, () => {
      let callback = () => { };
      it(`should add a ${hookType} hook`, () => {
        executable[hookType](callback);
        expect(executable[`_${hookType}Hooks`]).to.include(callback);
      });
      it("should return this", () => {
        expect(executable[hookType]()).to.eq(executable);
      });
    });
  });
  describe("main", () => {
    it("should return this", () => {
      expect(executable.main()).to.eq(executable);
    });
  });
  describe("execute", () => {
    let mainResult = { main: "result" };
    let options = { some: "options" };
    context("when everything succeeds", () => {
      beforeEach(() => {
        new Stub(executable._beforeHooks).receives("0").with().andReturns();
        new Stub(executable._beforeHooks).receives("1").with().andResolves();
        new Stub(executable._afterHooks).receives("0").with().andReturns();
        new Stub(executable._afterHooks).receives("1").with().andResolves();
        new Stub(executable).receives("main").with(options).andResolves(mainResult);
      });
      it("should call all relevant hooks and return main result", () => {
        return new Assertion(executable.exec).whenCalledWith(options).should().resolve({ success: true, main: mainResult });
      });
    });
    context("when a beforeHook fails", () => {
      beforeEach(() => {
        executable._beforeHooks.push(sinon.stub(), sinon.stub());
      });
      context("when a beforeHook throws an error", () => {
        beforeEach(() => {
          new Stub(executable._beforeHooks).receives("0").with().andRejects();
          new Stub(executable._beforeHooks).doesnt().receive("1");
        });
        it("should return unsuccessful response", () => new Assertion(executable.exec)
          .whenCalledWith().should().resolve({ success: false }));
      });
    });
    context("when main call fails", () => {

    });
    context("when an afterHook fails", () => {

    });
  });
});