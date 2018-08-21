var cdnMode = document.getElementById('cdnMode');
var cdnForm = document.getElementById('cdnForm');
var normForm = document.getElementById('normForm');
var cdn = false;
var worker = null;
var startTime = NaN;
var error_txt = document.getElementById('error');
var settingsWrapper = document.getElementById('settings-wrapper');
var gameWrapper = document.getElementById('game-wrapper');
var resultWrapper = document.getElementById('result-wrapper');
var timebar = document.getElementById('timebar');
var interval = null;
var answerField = document.getElementById('answer');
var best = document.getElementById('best');
var othersText = document.getElementById('othersText');

var numbers = [];
var target = null;
var duration = 0;
var gameEnd = null;
var exprsCount = [];

var settings = {
  type: null,
  nints: 6,
  lbound: 1,
  ubound: 9,
  bigints: 2,
  smolints: 4,
  duration: 30
}

function getNow(){
  return (new Date()).getTime();
}

cdnMode.onchange = function(){
  if (cdn){
    cdnForm.style.display = 'block';
    normForm.style.display = 'none';
    cdn = false;
  } else {
    cdnForm.style.display = 'none';
    normForm.style.display = 'block';
    cdn = true;
  }
}

function setupNorm(){
  gameEnd = getNow() + (duration*1000);
  for (var i = 0; i < settings.nints; i++) {
    numbers.push(Math.round(Math.random()*(settings.ubound - settings.lbound) + settings.lbound));
  }
  target = Math.floor(Math.random()*(999-100)+100);
  solve();
}

normForm.onsubmit = function(e){
  e.preventDefault();
  error_txt.innerHTML = 'Solving...';
  var numctr = parseInt(document.getElementById('n_num').value);
  var lbound = parseInt(document.getElementById('lBound').value);
  var ubound = parseInt(document.getElementById('uBound').value);
  settings.nints = numctr;
  settings.lbound = lbound;
  settings.ubound = ubound;
  settings.type = 0;
  duration = parseInt(document.getElementById('normTime').value);
  setupNorm();
}

function setupCDN(){
  gameEnd = getNow() + (duration*1000);
  largeInts = [25,50,75,100];
  for (var i = 0; i < settings.bigints; i++) {
    var tmpInt = largeInts[Math.floor(Math.random()*4)];
    while (numbers.indexOf(tmpInt) >= 0) {
      tmpInt = largeInts[Math.floor(Math.random()*4)];
    }
    numbers.push(tmpInt);
  }
  for (var i = 0; i < settings.smolints; i++) {
    numbers.push(Math.floor(Math.random()*(9-1)+1));
  }

  target = Math.floor(Math.random()*(999-100)+100);
  solve();
}

cdnForm.onsubmit = function(e){
  e.preventDefault();
  error_txt.innerHTML = 'Solving...';
  var large = parseInt(document.getElementById('large').value);
  var small = parseInt(document.getElementById('small').value);
  settings.bigints = large;
  settings.smolints = small;
  settings.type = 1;
  duration = parseInt(document.getElementById('cdnTime').value);
  if (large+small != 6){
    error_txt.innerHTML = 'Make sure the total numbers is 6 - this has been corrected but you might want to change it.';
    document.getElementById('small').value = 6-large;
    return;
  }
  setupCDN();
}

function solve(){
  var output = document.getElementById('output');
  var useWorker = false;

  if (worker){
    try{
      worker.terminate();
    }
    catch(e){
      if (typeof console !== "undefined") console.error(e);
    }
    worker = null;
  }

  try{
    numbers.sort(function(lhs,rhs){ return lhs - rhs;});

    if (useWorker){
      worker = new Worker("serviceworker.js");

      worker.addEventListener('message', function(event){
        var expr = event.data;
        if(expr){
          addExpr(expr);
        } else {
          worker = null;
          done();
        }
      },false);

      startTime = Date.now();
      worker.postMessage({target: target, numbers: numbers});
    } else {
      startTime = Date.now();
      solutions(target, numbers, addExpr);
      done();
    }

  }
  catch (e){
    if (typeof console !== "undefined") console.error(e);

    if (worker) {
      try{
        worker.terminate();
      }
      catch (second_e){
        if (typeof console !== "undefined") console.error(e);
      }
      worker = null;
    }

    alert(String(e));
  }

  function addExpr(expr){
    exprsCount.push(expr.toString());
    if (numbers.length > 6){
      worker.terminate();
    }
  }

  function done(){
    var endTime = Date.now();
    error_txt.innerHTML = '';
    loadGame();
  }
}

function loadGame(){
  document.getElementById('target').innerHTML = "Target: "+String(target);
  var numbersElem = document.getElementById('numbersCtnr');
  for (var i = 0; i < numbers.length; i++) {
    var num = document.createElement('div');
    num.className = 'numElem';
    num.appendChild(document.createTextNode(String(numbers[i])));
    numbersElem.appendChild(num);
  }
  settingsWrapper.style.display = 'none';
  gameWrapper.style.display = 'block';
  answerField.focus();
  interval = setInterval(function(){
    var progress = 1-((gameEnd - getNow())/(duration*1000));
    timebar.style.width = String(400*progress)+'px';
    if (progress >= 1) {
      clearInterval(interval);
      endGameFunc();
    }
  },100);
}

answerField.onkeyup = function(e){
  if (e.keyCode == 13){
    endGameFunc();
  }
}

function count(arr) {
  return arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
}

function endGameFunc(){
  exprsCount.sort(function(a, b){ return a.length - b.length; });
  if (exprsCount.length >= 1){
    document.getElementById('shortest').style.display = 'block';
    best.innerHTML = exprsCount[0];
  }
  if (exprsCount.length > 1){
    if (exprsCount.length == 1){
      othersText.innerHTML = 'There was also '+String(exprsCount.length-1)+' other possible answer.';
    } else {
      othersText.innerHTML = 'There were also '+String(exprsCount.length-1)+' other possible answers.';
    }
    output.innerHTML = '';
    for (var i = 1; i < exprsCount.length; i++){
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(exprsCount[i]));
      output.appendChild(li);
    }
  } else {
      othersText.innerHTML = '';
  }
  clearInterval(interval);
  var illegal = [];
  var overused = [];
  var rawAnswer = answerField.value;
  if (rawAnswer == ''){
    var answer = 0;
    rawAnswer = 0;
  } else {
    try {
      var answer = eval(rawAnswer);
    } catch (e){
      document.getElementById('finishBTN').innerHTML = 'Try Again';
      document.getElementById('error_text').innerHTML = 'Could not parse your expression ¯\\_(ツ)_/¯ sorry.<br> Try to fix mismatched parentheses and press "try again".';
      return
    }
    nums = rawAnswer.match(/\d+/g);
    for (var i = 0; i < nums.length; i++) {
      if (numbers.indexOf(parseInt(nums[i])) == -1){
        illegal.push(nums[i]);
      }
    }
    if (illegal.length == 0){
      var numCounts = count(numbers);
      var ansCounts = count(nums);
      for (var i = 0; i < nums.length; i++){
        if (ansCounts[nums[i]] > numCounts[nums[i]]){
          if (overused.indexOf(nums[i]) == -1){
            overused.push(nums[i]);
          }
        }
      }
    }
  }

  answerField.value = '';
  document.getElementById('finishBTN').innerHTML = 'Finish';
  gameWrapper.style.display = 'none';
  resultWrapper.style.display = 'block';
  timebar.style.width = '0px';
  document.getElementById('numbersCtnr').innerHTML = '';

  clearInterval(interval);
  var resStr = '';
  if (illegal.length > 0 || overused.length > 0){
    document.getElementById('result').innerHTML = 'Incorrect answer.';
      resStr = 'Your answer was: '+rawAnswer+' = '+answer+'. ';
    if (illegal.length > 0){
      resStr += 'It included the following numbers that weren\'t in the original problem: <br>'+illegal;
    }

    if (overused.length > 0){
      resStr += 'You used the following number(s): '+String(overused)+', too many times.';

    }

    if (exprsCount.length > 0){
      resStr += '<br><br>The target value was <b>'+String(target)+'</b>';
    } else {
      resStr += '<br><br>There is, however, no solution to this problem.';
    }
  } else if (answer ==  target){
    document.getElementById('result').innerHTML = 'Correct!';
    if (exprsCount.length > 0){
      resStr = 'Your answer was: '+rawAnswer+'.<br>The target value was <b>'+String(target)+'</b>';
    } else {
      resStr = 'Your answer was: '+rawAnswer+'.<br>Well done, this was the only solution to the problem.';
    }
  } else {
    document.getElementById('result').innerHTML = String(Math.abs(target-answer))+' away...';
    if (exprsCount.length > 0){
      resStr = 'You answered: '+rawAnswer+' = '+answer+'.<br>The target value was <b>'+String(target)+'</b>';
    } else {
      resStr = 'You answered: '+rawAnswer+' = '+answer+'.<br>There were unfortunately no solutions to this problem.';
    }
  }
  document.getElementById('resTxt').innerHTML = resStr;
}

function clear(){
  document.getElementById('shortest').style.display = 'none';
  document.getElementById('output').innerHTML = '';
  resultWrapper.style.display = 'none';
  numbers = [];
  exprsCount = [];
  document.getElementById('error_text').innerHTML = '';
  document.getElementById('finishBTN').innerHTML = 'Finish';
  document.getElementById('working').value = '';
}

function reset(){
  clear();
  settingsWrapper.style.display = 'block';
  document.getElementById('cdnSubmit').focus();
}

function retry(){
  clear();
  gameWrapper.style.display = 'block';
  settingsWrapper.style.display = 'none';
  if (settings.type == 0) {
    setupNorm();
  } else {
    setupCDN();
  }
}
