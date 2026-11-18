function bindControllerMethods(controller) {
  const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
    .filter((name) => name !== 'constructor');

  return Object.fromEntries(
    methodNames.map((name) => [name, controller[name].bind(controller)])
  );
}

module.exports = bindControllerMethods;
