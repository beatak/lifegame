(function () {
  "use strict";

  var init = function () {
    console.log( 'init' );

    var canvas = $('#boardcanvas')[0];
    if (!canvas) {
      console.log( 'no canvas found: exiting.' );
      return;
    }
    var gameview = window.gameview = new GameView( canvas );
    var board = window.board = new Board( gameview );
    gameview.showStatus( false );

    var $toggle = $('#status-toggle');
    $toggle.on( 'click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (window.board.isRunning) {
        window.board.turnOff();
      }
        else {
        window.board.turnOn();
      }
    });
  };

  $(init);
})();

// ===============================================

var Cell = window.Cell = function (x, y, i, context, collection) {
  this.x = x;
  this.y = y;
  this.i = i;
  this.life = false;
  this.life = !(Math.round( Math.random() ));
  this.pastlife = this.life;
  this.context = context;
  this.collection = collection;
};

Cell.prototype.next = function () {
  this.life = this.collection.nextLife(this.x, this.y);
};

Cell.prototype.render = function () {
  if (this.life) {
    this.context.fillStyle = 'rgba(255, 0, 0, 1)';
  }
  else {
    this.context.fillStyle = 'rgba(255, 255, 255, 1)';
  }
  this.context.fillRect(this.x, this.y, 1, 1);
  this.pastlife = this.life;
};


var CellCollection = function (width, height, context) {
  var i = 0;
  var cells = this.cells = [];
  var hash = this.hash = {};
  var c;
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      c = new Cell(x, y, i, context, this);
      cells.push( c );
      hash[ ['x', x, '/', 'y', y].join('') ] = c;
      ++i;
    }
  }
};

CellCollection.prototype.nextLife = function (x, y) {
  // called by cell.
  // accessing pastlife.
};

CellCollection.prototype.getCell = function (x, y) {
  return this.hash[ ['x', x, '/', 'y', y].join('') ];
};

CellCollection.prototype.turn = function () {
  for (var i = 0, len = this.cells.length; i < len; ++i) {
    this.cells[i].next();
  }
  this.render();
};

CellCollection.prototype.render = function () {
  for (var i = 0, len = this.cells.length; i < len; ++i) {
    this.cells[i].render();
  }
};

// ===============================================

var GameView = window.GameView = function (elm) {
  var $canvas = $(elm);
  var self = this;
  this.multiplier = 10;
  this.width = elm.width = Math.floor( $canvas.width() / this.multiplier );
  this.height = elm.height = Math.floor( $canvas.height() / this.multiplier );

  this.status = $('#status')[0];
  this.generation = $('#generation')[0];
  this.context = elm.getContext('2d');
  this.context.imageSmoothingEnabled = false; 

  this.cells = new CellCollection(this.width, this.height, this.context);
  this.cells.render();

  $canvas.on( 'click', function (ev) {
    var offset = $canvas.offset();
    var x = Math.floor( Math.round(ev.clientX - offset.left) / self.multiplier );
    var y = Math.floor( Math.round(ev.clientY - offset.top) / self.multiplier );
    var cell = self.cells.getCell(x, y);
    console.log( x, y );
    ev.preventDefault();
    ev.stopPropagation();
    cell.life = !cell.life;
    cell.render();
  });
};

GameView.prototype.showGeneration = function (gen) {
  this.generation.innerHTML = gen;
};

GameView.prototype.showStatus = function (st) {
  this.status.innerHTML = st ? 'on' : 'off';
};

// ===============================================

var Board = window.Board = function (view, cells) {
  this.generation = 0;
  this.isRunning = false;
  this.handler = -1;
  this.onInterval = $.proxy( this._onInterval, this );
  this.determineInterval();

  this.view = view;
  this.cells = cells;
};

Board.prototype.fps = 30;

Board.prototype.determineInterval = function () {
  this.MSInterval = Math.round( 1000 / this.fps );
};

Board.prototype.setFps = function (fps) {
  if (!fps > 60) {
    console.log( 'too high fps' );
    return false;
  }
  this.MSInterval = Math.round( 1000 / this.fps );
  this.determineInterval();
};

Board.prototype.turnOn = function () {
  if (this.isRunning) {
    return false;
  }
  this.handler = setInterval(this.onInterval, this.MSInterval);
  this.isRunning = true;
  this.view.showStatus( true );
  return true;
};

Board.prototype.turnOff = function () {
  if (!this.isRunning) {
    return false;
  }
  clearInterval(this.handler);
  this.isRunning = false;
  this.handler = -1;
  this.view.showStatus( false );
  return true;
};

Board.prototype._onInterval = function () {
  ++this.generation;
  this.view.showGeneration( this.generation );
};


