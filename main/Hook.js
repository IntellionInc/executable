module.exports = class Hook {
  constructor(type, method) {
    this.type = type;
    this.method = method;
    this.success = true;
    this.called = false;
    this.result = null;
    this.error = null;
  };
  call = async (...args) => {
    this.called = true;
    try {
      this.result = await this.method(...args);
      if (this.result && this.result.success === false) this.#errorHandler(this.result.error);
    } catch (error) { this.#errorHandler(error) };
    return this;
  };
  #errorHandler = (error) => {
    this.success = false;
    this.error = error;
  };
};