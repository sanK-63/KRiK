function rollButtons() {
  const xReg = /X\((.*?)\)/;
  const yReg = /Y\((.*?)\)/;
  const zReg = /Z\((.*?)\)/;
  // positive lookbehind not supported in all browsers
  // (?<=Z\()[0-9]+
  let rollBtn = document.querySelectorAll('.roll-button');
  rollBtn.forEach((button) => {
    button.addEventListener('click', () => {
      const deg = 360;
      // check if element is one that is already rotated on the X axis by default
      if( button.classList.contains('octa') || button.classList.contains('pentrap') || button.classList.contains('icosa')) {
        rotate(button,'Z',zReg,deg);
      } else {
        rotate(button,'Y',yReg,deg);
      }
      const min = button.getAttribute('data-min');
      const max = button.getAttribute('data-max');
      const parent = button.parentElement;
      const dice = Number(parent.parentElement.querySelector('.dice-num').value);
      const mod = Number(parent.parentElement.querySelector('.modifier').value);

      const outcome = parent.parentElement.querySelector('.outcome');
      //console.log(`min: ${min}, max: ${max}, dice: ${dice}, mod: ${mod}`);
      // roll(min value, max value, number of dice, modifier)
      console.log( roll(min, max, dice, mod) );

      setTimeout(() => {
        outcome.innerText = roll(min, max, dice, mod);
      }, 900);
    });
  });
}
rollButtons();

// random inclusive number function
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

// dice rolll function
function roll(min, max, dice, mod) {
  let num = [];
  let i = 0;
  do {
    i = i + 1;
    num.push(getRandomIntInclusive(min, max));
  } while (i < dice);
  const sum = (num.reduce((partialSum, a) => partialSum + a, 0)) + mod;
  //console.log(num);
  //console.log(sum);
  return sum;
}

// rotate function
function rotate(element,axis,reg,degree) {
  if( element.style.transform === '' ) {
    element.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
  }
  const transform = element.style.transform;
  //need to get current value
  let currentDegree = transform.match(reg);
  currentDegree = Number(currentDegree[0].match( /[0-9]+/ ));
  const deg = degree + currentDegree;
  element.style.transform = transform.replace(reg, `${axis}(${deg}deg)`);
}

// number increment function
function numberIncrements() {
  const numMinus = document.querySelectorAll('.num-minus');
  const numPlus = document.querySelectorAll('.num-plus');

  numMinus.forEach((button) => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.num');
      input.value--;
    });
  });

  numPlus.forEach((button) => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.num');
      input.value++;
    });
  });
}
numberIncrements();