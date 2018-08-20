// Define a function to model an expression
function Expr() {}

// If the new precedence is greater than the expression precedensce, wrap it in
// backets.
Expr.prototype = {
  toStringUnder: function (precedensce) {
    if (precedensce > this.precedence) {
      return '('+this.toString()+')';
    }
    else {
      return this.toString();
    }
  }
};

// Define a funcition to model binary expressions
function BinExpr (op) {
  this.op = op;
}

// The binary expression function inherits the Expr() function's prototype
//methods
BinExpr.prototype = new Expr();

// Initialisation for a Binary Expression - set all it's properties.
BinExpr.prototype.initBinExpr = function (left, right, value, generation) {
  this.left       = left;
  this.right      = right;
  this.value      = value;
  this.used       = left.used | right.used;
  this.id         = this.toId();
  this.generation = generation;
  return this;
}

// Returns an assembled version of a binary expression with two values (left and
// right) and an operation
BinExpr.prototype.toString = function () {
  var p = this.precedence;
  return this.left.toStringUnder(p) + ' ' + this.op + ' ' + this.right.toStringUnder(p);
};

// returns a string wrapped in parentheses
BinExpr.prototype.toId = function () {
  return '('+this.left.toId()+this.op+this.right.toId()+')';
}

// Define the Add operation and define its initialisation as a BinExpr
function Add () {}

Add.prototype = new BinExpr('+');

Add.prototype.precedence = 0;

Add.prototype.init = function (left, right, generation){
  return this.initBinExpr(left, right, left.value + right.value, generation);
}

// Define the Sub operation and define its initialisation as a BinExpr
function Sub () {}

Sub.prototype = new BinExpr('-');

Sub.prototype.precedence = 1;

Sub.prototype.init = function (left, right, generation) {
  return this.initBinExpr(left, right, left.value - right.value, generation);
}

//Define the Div operation and its initialisation as a BinExpr
function Div () {}

Div.prototype = new BinExpr('/');

Div.prototype.precedence = 2;

Div.prototype.init = function (left, right, generation){
  return this.initBinExpr(left, right, left.value / right.value, generation);
}

//Define the Mul operation and its initialisation as a BinExpr
function Mul () {}

Mul.prototype = new BinExpr('*');

Mul.prototype.precedence = 3;

Mul.prototype.init = function (left, right, generation) {
  return this.initBinExpr(left, right, left.value * right.value, generation);
}

//Define values as a type of expression and definie its initialisation function.
function Val () {}

Val.prototype = new Expr();

Val.prototype.op = '$';

Val.prototype.precedence = 4;

Val.prototype.init = function (value, index, generation) {
  this.value      = value;
  this.index      = index;
  this.used       = 1 << index;
  this.id         = this.toId();
  this.generation = generation;
  return this;
}

Val.prototype.toString = function () {
  return String(this.value);
};

Val.prototype.toId = Val.prototype.toStringUnder = Val.prototype.toString;

//Function to return boolean of whether to add or not -this elminates duplicates
function isNormalizedAdd (left, right) {
  var ro = right.op;
  if (ro === '+' || ro === '-'){
    return false;
  }

  var lo = left.op;
  if(lo === '+'){
    return left.right.value <= right.value;
  }
  else if (lo === '-'){
    return false;
  }
  else {
    return left.value <= right.value;
  }
}

//Function to return boolean of whether to sub or not -this elminates duplicates
function isNormalizedSub (left, right) {
  var ro = right.op;
  if (ro === '+' || ro === '-') {
    return false;
  }

  var lo = left.op;
  if (lo === '-'){
    return left.right.value <= right.value;
  } else {
    return true;
  }
}

//Function to return boolean of whether to multiply or not
function isNormalizedMul (left, right){
  var ro = right.op;
  if (ro === '*' || ro === '/'){
    return false;
  }

  var lo = left.op;
  if (lo === '*'){
    return left.right.value <= right.value;
  }
  else if (lo === '/'){
    return false;
  }
  else {
    return left.value <= right.value;
  }
}

//Function to return whether or not to divide
function isNormalizedDiv (left, right) {
  var ro = right.op;
  if (ro === '*' || ro === '/') {
    return false;
  }

  var lo = left.op;
  if (lo === '/') {
    return left.right.value <= right.value;
  }
  else {
    return true;
  }
}


function make (a, b, generation, addExpr){
  var avalue = a.value;
  var bvalue = b.value;

  if (isNormalizedAdd(a,b)) {
    addExpr(new Add().init(a, b, generation));
  }
  else if (isNormalizedAdd(b, a)) {
    addExpr(new Add().init(b, a, generation));
  }

  //Don't bother multiplying by 1...
  if (avalue !== 1 && bvalue !== 1) {
    if (isNormalizedMul(a, b)) {
      addExpr(new Mul().init(a, b, generation));
    }
    else if (isNormalizedMul(b, a)) {
      addExpr(new Mul().init(b, a, generation));
    }
  }

  //Common conditions for both division and subtraction are that value a must
  //be greater than value b.
  if (avalue > bvalue) {
    //Disregard subtraction by 0
    if (avalue - bvalue !== bvalue && isNormalizedSub(a, b)) {
      addExpr(new Sub().init(a, b, generation));
    }
    //Omit division by 1, ensure the quotient has no remainder
    if (bvalue !== 1 &&avalue % bvalue === 0 && avalue / bvalue !== bvalue && isNormalizedDiv(a,b)) {
      addExpr(new Div().init(a, b, generation));
    }
  }
  else if (bvalue > avalue){
    //same subtraction conditions as above
    if (bvalue - avalue !== avalue && isNormalizedSub(b, a)) {
      addExpr(new Sub().init(b, a, generation));
    }
    //same division conditions as above
    if (avalue !== 1 && bvalue % avalue === 0 && bvalue / avalue !== avalue && isNormalizedDiv(b, a)) {
      addExpr(new Div().init(b, a, generation));
    }
  }
  else if (bvalue !== 1){
    //catch-all condition for remaining divisions
    if (isNormalizedDiv(a, b)){
      addExpr(new Div().init(a, b, generation));
    }
    else if (isNormalizedDiv(b, a)) {
      addExpr(new Div().init(b, a, generation));
    }
  }
}

//shorter make function.
function make_half (a, b, generation, addExpr){
  var avalue = a.value;
  var bvalue = b.value;

  if (isNormalizedAdd(a, b)){
    addExpr(new Add().init(a, b, generation));
  }

  if (avalue !== 1 && bvalue !== 1){
    if (isNormalizedMul(a, b)) {
      addExpr(new Mul().init(a, b, generation));
    }
  }

  if (avalue > bvalue) {
    if (avalue - bvalue !== bvalue && isNormalizedSub(a, b)) {
      addExpr(new Sub().init(a, b, generation));
    }

    if (bvalue !== 1 && avalue % bvalue === 0 && avalue / bvalue !== bvalue && isNormalizedDiv(a, b)) {
      addExpr(new Div().init(a, b, generation));
    }
  }
  else if (avalue === bvalue && bvalue !== 1){
    if (isNormalizedDiv(a, b)) {
      addExpr(new Div().init(a, b, generation));
    }
  }
}

function solutions (target, numbers, cb) {
  var numcnt = numbers.length;
  //hashtable permutations of numbers and operators?
  var full_usage = ~(~0 << numcnt);
  var generation = 0;
  var segments = new Array(full_usage);
  for (var i = 0; i < segments.length; ++ i) {
    segments[i] = [];
  }
  var exprs = [];
  var has_single_number_solution = false;
  for (var i = 0; i < numbers.length; ++ i) {
    var num = numbers[i];
    var expr = new Val().init(num, i, generation);
    if (num === target) {
      if (!has_single_number_solution) {
        //if the resulting number equals the target there exists such an expr
        has_single_number_solution = true;
        cb(expr);
      }
    }
    else {
      exprs.push(expr);
      segments[expr.used - 1].push(expr);
    }
  }

  //Is the following code redundant?
  var uniq_solutions = {};

  function addExpr (expr) {
    if (expr.value === target){
      if (uniq_solutions[expr.id] !== true){
        uniq_solutions[expr.id] = true;
        cb(expr);
      }
    }
    else if (expr.used !== full_usage) {
      exprs.push(expr);
      segments[expr.used -1].push(expr);
    }
  }

  var lower = 0;
  var upper = numcnt;
  while (lower < upper) {
    var prev_generation = generation ++;
    for (var b = lower; b < upper; ++ b){
      var bexpr = exprs[b];
      var bused = bexpr.used;

      for (var aused = 1; aused <= segments.length; ++ aused){
        if ((bused & aused) === 0) {
          var segment = segments[aused - 1];
          for (var i=0; i < segment.length; ++ i){
            var aexpr = segment[i];
            if (aexpr.generation === prev_generation){
              make_half(aexpr, bexpr, generation, addExpr);
            }
            else {
              make (aexpr, bexpr, generation, addExpr);
            }
          }
        }
      }
    }
    lower = upper;
    upper = exprs.length;
  }
}
