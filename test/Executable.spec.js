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
        yield: { success: true, main: null }
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
        new Stub(executable._beforeHooks).receives("2").with().andResolves({});
        new Stub(executable._beforeHooks).receives("3").with().andReturns({});
        new Stub(executable._afterHooks).receives("0").with().andReturns();
        new Stub(executable._afterHooks).receives("1").with().andResolves();
        new Stub(executable).receives("main").with(options).andResolves(mainResult);
      });
      it("should call all relevant hooks and return main result", () => {
        return new Assertion(executable.exec).whenCalledWith(options).should().resolve({ success: true, main: mainResult });
      });
    });
    context("hook failure", () => {
      ["beforeHook", "afterHook"].forEach(hookType => {
        context(`when a ${hookType} fails`, () => {
          mainResult = hookType === "afterHook" ? mainResult : null;
          beforeEach(() => {
            executable[`_${hookType}s`].push(sinon.stub(), sinon.stub());
            new Stub(executable[`_${hookType}s`]).doesnt().receive("1");
            if (hookType === "afterHook") new Stub(executable).receives("main").andResolves(mainResult);
          });
          [{
            name: "async error",
            cb: () => new Stub(executable[`_${hookType}s`]).receives("0").with().andRejects(),
          }, {
            name: "sync error",
            cb: () => new Stub(executable[`_${hookType}s`]).receives("0").with().andThrows(),
          }, {
            name: "unsuccessful response",
            cb: () => new Stub(executable[`_${hookType}s`]).receives("0").with().andResolves({ success: false }),
          }].forEach(hookResponse => {
            context(`when a ${hookType} returns ${hookResponse.name} `, () => {
              beforeEach(hookResponse.cb);
              it("should return unsuccessful response", () => new Assertion(executable.exec)
                .whenCalledWith().should().resolve({ success: false, main: mainResult }));
            });
          });
        });
      });
    });
    context("main call failure", () => {
      [{
        name: "async error",
        mainResult: null,
        cb: () => new Stub(executable).receives("main").with(options).andRejects(),
      }, {
        name: "sync error",
        mainResult: null,
        cb: () => new Stub(executable).receives("main").with(options).andThrows(),
      }, {
        name: "unsuccessful response",
        mainResult: { success: false },
        cb: () => new Stub(executable).receives("main").with(options).andResolves({ success: false }),
      }].forEach(hookResponse => {
        context(`when main call returns ${hookResponse.name}`, () => {
          beforeEach(hookResponse.cb);
          it("should return unsuccessful response", () => new Assertion(executable.exec)
            .whenCalledWith(options).should().resolve({ success: false, main: hookResponse.mainResult }));
        });
      })
    });
  });
});