const test = (() => {
  const testFunc = () => {
    const elIntroductionWrap = document.getElementsByClassName('introduction__wrap');

    if(!elIntroductionWrap) {return;}
    elIntroductionWrap[0].classList.add('test');
  };

  return {
    init() {
      testFunc();
    }
  }
})();

test.init();
