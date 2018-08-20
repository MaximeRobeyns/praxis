var timerElem = document.getElementById('timer');
var scoreElem = document.getElementById('score');
var equation = document.getElementById('eqtn-elem');
var answer = document.getElementById('answer');
var url = new URL(window.location.href);
var score = 0;
var final_score = document.getElementById('final-score');
var true_answer = null;
var num1, num2, c, c_max = null;
var wrapper = document.getElementById('game-wrapper');
var endcard = document.getElementById('endcard');
var stats = document.getElementById('stats');

// Get and parse the url parameters.
var args = {
   add: {
     inc: url.searchParams.get("add"),
     add1min: parseInt(url.searchParams.get("add1min")),
     add1max: parseInt(url.searchParams.get("add1max")),
     add2min: parseInt(url.searchParams.get("add2min")),
     add2max: parseInt(url.searchParams.get("add2max"))
   },
   sub: url.searchParams.get("sub"),
   mult: {
     inc: url.searchParams.get("mult"),
     mult1min: parseInt(url.searchParams.get("mult1min")),
     mult1max: parseInt(url.searchParams.get("mult1max")),
     mult2min: parseInt(url.searchParams.get("mult2min")),
     mult2max: parseInt(url.searchParams.get("mult2max"))
   },
   div: url.searchParams.get("div"),
   time: parseInt(url.searchParams.get("dur"))
}

var raw_ops = [args.add.inc, args.sub, args.mult.inc, args.div];
var ops = new Array();
for (var i=0; i < raw_ops.length; i++){
    if (raw_ops[i] != null){
        ops.push(raw_ops[i]);
    }
    if (ops.length == 0){
        ops = ['add', 'sub', 'mult', 'div'];
    }
}

function exitFunction(){
    final_score.innerHTML = "Score: "+String(score);
    stats.innerHTML = "Average time per answer: "+String((args.time / score).toFixed(2))+" seconds";
    wrapper.style.display = "none";
    endcard.style.display = "block";
}

// Update the timer
function getNow(){
  return Math.round((new Date()).getTime() / 1000);
}
now = getNow()
end = now +parseInt(args.time);
remaining = end - now
timerElem.innerHTML = "Seconds left: "+String(remaining);
var int = setInterval(function(){
  remaining = end - getNow();
  timerElem.innerHTML = "Seconds left: "+String(remaining);
  if (remaining <= 0) {
    clearInterval(int);
    exitFunction();
  }
},1000)

function incrementScore(){
  score = score+1;
  scoreElem.innerHTML = "Score: "+String(score);
}

function setQuestion(str){
    equation.innerHTML = str;
}

function getNewOp(){
    operation = ops[Math.floor((Math.random() * ops.length))];
    if (operation == 'add'){
        var num1 = Math.round(Math.random() * (args.add.add1max - args.add.add1min) + args.add.add1min);
        var num2 = Math.round(Math.random() * (args.add.add2max - args.add.add2min) + args.add.add2min);
        true_answer = String(num1 + num2);
        setQuestion(String(num1)+" + "+String(num2)+" = ");
    } else if (operation == 'sub'){
        var num1 = Math.round(Math.random() * (args.add.add1max - args.add.add1min) + args.add.add1min);
        var num2 = Math.round(Math.random() * (args.add.add2max - args.add.add2min) + args.add.add2min);
        if (num1 < num2){
            var tmp = num1;
            var num1 = num2;
            num2 = tmp;
        }
        true_answer = String(num1 - num2);
        setQuestion(String(num1)+" – "+String(num2)+" = ");
    } else if (operation == 'mult'){
        var num1 = Math.round(Math.random() * (args.mult.mult1max - args.mult.mult1min) + args.mult.mult1min);
        var num2 = Math.round(Math.random() * (args.mult.mult2max - args.mult.mult2min) + args.mult.mult2min);
        true_answer = String(num1 * num2);
        setQuestion(String(num1)+ " × "+String(num2)+" = ");
    } else if (operation == 'div'){
        var c_max = Math.round(args.mult.mult2max / args.mult.mult1min)
        var num1 = Math.round(Math.random() * (args.mult.mult1max - args.mult.mult1min) + args.mult.mult1min);
        var c = Math.round(Math.random() * (c_max - 2) + 2);
        var num2 = c * num1
        true_answer = String(c)
        setQuestion(String(num2)+" ÷ "+String(num1)+" = ");
    }

}

answer.onkeyup = function(e){
    if (answer.value == true_answer){
        answer.value = '';
        incrementScore();
        getNewOp();
    }
}

window.onload = function(){
    getNewOp();
    answer.focus();
};
