export default (() => {
  const _consoleTest = () => {
    console.log('test compile for es6');
  };

  return {
    init() {
      _consoleTest();
    }
  }
})();
