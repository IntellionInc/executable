const { Assertion, Stub, expect } = require("./ExecutableMatcha");
const { Hook } = require("../main");
describe("Hook", () => {
  let hook, type = "some-type", method = () => { };

  beforeEach(() => {
    hook = new Hook(type, method);
  });
  describe("constructor", () => {
    it("should create a hook object", () => new Assertion(hook)
      .toHaveProperties({ type, method, success: true, called: false, result: null, error: null }));
  });
  describe("call", () => {
    callAssertions = (assertions) => {
      let { input, result, success, error } = assertions;
      it("should store result", () => new Assertion(hook.call).whenCalledWith(...input)
        .should(r => expect(hook.result).to.eq(result)).succeed());
      it("should record success", () => new Assertion(hook.call).whenCalledWith(...input)
        .should(r => expect(hook.success).to.eq(success)).succeed());
      it("should not hold an error", () => new Assertion(hook.call).whenCalledWith(...input)
        .should(r => expect(hook.error).to.eq(error)).succeed());
      it("should return this", () => new Assertion(hook.call)
        .whenCalledWith(...input).should().resolve(hook));
    }
    [
      { input: [], args: [] },
      { input: ["Arg1", "arg2"], args: ["Arg1", "arg2"] }
    ].forEach(inputCase => {
      context(`when input is ${String(inputCase.input)}`, () => {
        let methodStub;
        beforeEach(() => {
          methodStub = new Stub(hook).receives("method").with(...inputCase.args);
        });
        afterEach(() => {
          expect(hook.called).to.eq(true);
        });
        context("for a successfull method call", () => {
          let resolution = { some: "result" };
          [
            { context: "for an async method", stubAction: "andResolves" },
            { context: "for a sync method", stubAction: "andReturns" }
          ].forEach(methodType => {
            context(methodType.context, () => {
              beforeEach(() => methodStub[methodType.stubAction](resolution));
              callAssertions({
                input: inputCase.input, result: resolution, success: true, error: null
              });
            });
          });
          context("when method returns an unsuccessful response", () => {
            let resolution = { success: false, error: "some-error" };
            [
              { context: "for an async method", stubAction: "andResolves" },
              { context: "for a sync method", stubAction: "andReturns" }
            ].forEach(methodType => {
              context(methodType.context, () => {
                beforeEach(() => methodStub[methodType.stubAction](resolution));
                callAssertions({
                  input: inputCase.input, result: resolution, success: false, error: "some-error"
                })
              });
            });
          });
          context("when method throws an error", () => {
            let error = new Error("some-error");
            [
              { context: "for an async method", stubAction: "andRejects" },
              { context: "for a sync method", stubAction: "andThrows" }
            ].forEach(methodType => {
              context(methodType.context, () => {
                beforeEach(() => methodStub[methodType.stubAction](error));
                callAssertions({
                  input: inputCase.input, result: null, success: false, error: error
                })
              });
            });
          });
        });
      });
    });
  });

});