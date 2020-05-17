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
        _beforeHooks: [], _afterHooks: [],
        yield: { success: true, main: null, errors: [] }
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
    let args = { some: "args" };
    let args2 = { other: "args" };
    context("when everything succeeds", () => {
      beforeEach(() => {
        new Stub(executable._beforeHooks).receives("0").with().andReturns();
        new Stub(executable._beforeHooks).receives("1").with().andResolves();
        new Stub(executable._beforeHooks).receives("2").with().andResolves({});
        new Stub(executable._beforeHooks).receives("3").with().andReturns({});
        new Stub(executable._afterHooks).receives("0").with().andReturns();
        new Stub(executable._afterHooks).receives("1").with().andResolves();
        new Stub(executable).receives("main").with(args, args2).andResolves(mainResult);
      });
      it("should call all relevant hooks and return main result", () => {
        return new Assertion(executable.exec)
          .whenCalledWith(args, args2)
          .should()
          .resolve({ success: true, main: mainResult, errors: [] });
      });
    });
    context("hook failure", () => {
      ["beforeHook", "afterHook"].forEach(hookType => {
        context(`when a ${hookType} fails`, () => {
          let error = new Error("some-hook-error");
          mainResult = hookType === "afterHook" ? mainResult : null;
          beforeEach(() => {
            executable[`_${hookType}s`].push(sinon.stub(), sinon.stub());
            new Stub(executable[`_${hookType}s`]).doesnt().receive("1");
            if (hookType === "afterHook") new Stub(executable).receives("main").andResolves(mainResult);
          });
          [{
            name: "async error",
            cb: () => new Stub(executable[`_${hookType}s`])
              .receives("0")
              .with()
              .andRejects(error),
          }, {
            name: "sync error",
            cb: () => new Stub(executable[`_${hookType}s`])
              .receives("0")
              .with()
              .andThrows(error),
          }, {
            name: "unsuccessful response",
            cb: () => new Stub(executable[`_${hookType}s`])
              .receives("0")
              .with()
              .andResolves({ success: false, error }),
          }].forEach(hookResponse => {
            context(`when a ${hookType} returns ${hookResponse.name} `, () => {
              beforeEach(hookResponse.cb);
              it("should return unsuccessful response", () => new Assertion(executable.exec)
                .whenCalledWith()
                .should()
                .resolve({ success: false, main: mainResult, errors: [error] }));
            });
          });
        });
      });
    });
    context("main call failure", () => {
      let error = new Error("some-main-error");
      [{
        name: "async error",
        mainResult: null,
        cb: () => new Stub(executable).receives("main").with(args).andRejects(error),
      }, {
        name: "sync error",
        mainResult: null,
        cb: () => new Stub(executable).receives("main").with(args).andThrows(error),
      }, {
        name: "unsuccessful response",
        mainResult: { success: false, error },
        cb: () => new Stub(executable).receives("main").with(args).andResolves({ success: false, error }),
      },
      {
        name: "unsuccessful response with no error data",
        mainResult: { success: false },
        cb: () => new Stub(executable).receives("main").with(args).andResolves({ success: false }),
      }
      ].forEach(hookResponse => {
        context(`when main call returns ${hookResponse.name}`, () => {
          beforeEach(hookResponse.cb);
          it("should return unsuccessful response", () => new Assertion(executable.exec)
            .whenCalledWith(args).should().resolve({ success: false, main: hookResponse.mainResult, errors: [hookResponse.name === "unsuccessful response with no error data" ? undefined : error] }));
        });
      })
    });
  });
});