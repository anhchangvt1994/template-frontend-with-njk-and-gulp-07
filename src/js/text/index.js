const text = (() => {
  const  _testTextConsole = () => {
    const elText = document.getElementsByClassName('text__block');
    if(!elText) {return}

    console.log(elText.innerHTML);
  };

  return {
    init() {
      _testTextConsole();
    }
  }
})();

text.init();
