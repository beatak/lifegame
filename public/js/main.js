"use strict";

(function () {
  "use strict";

  var init = function () {
    console.log( 'init' );

    var canvas = window.canvas = $('#boardcanvas')[0];
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
      if (board.isRunning) {
        board.turnOff();
      }
      else {
        board.turnOn();
      }
    });

    var $wipe = $('#wipe');
    $wipe.on( 'click', function (ev) {
        console.log( 'wiping' );
        ev.preventDefault();
        ev.stopPropagation();
        board.wipe();
    });

  };

  $(init);
})();

// ===============================================

var Cell = window.Cell = function (x, y, side, i, context, collection) {
  this.x = x;
  this.y = y;
  this.i = i;
  this.life = false;
  this.life = !(Math.round( Math.random() ));
  this.past = this.life;
  this.future = false;
  this.context = context;
  this.collection = collection;
  this.side = side;
};

Cell.prototype.setLife = function (life, noPast) {
    if (!this.noPast) {
        this.past = this.life;
    }
    this.life = life;
};

Cell.prototype.copyFuture = function () {
    this.future = this.life;
};

Cell.prototype.next = function () {
  this.future = this.collection.nextLife(this.x, this.y, this.future);
};

Cell.prototype.render = function (isTurning) {
  var x = this.getX();
  var y = this.getY();
  var cond;
    if (isTurning) {
        cond = this.future;
    }
    else {
        cond = this.life;
    }

  if (cond) {
    this.context.fillStyle = 'rgba(255, 0, 0, 1)';
  }
  else {
    this.context.fillStyle = 'rgba(255, 255, 255, 1)';
  }
  this.context.fillRect(x, y, this.side, this.side);
  if (isTurning) {
      this.setLife(cond)
  }
};

Cell.prototype.getX = function () {
    return this.x * this.side;
};

Cell.prototype.getY = function () {
    return this.y * this.side;
};

Cell.prototype.die = function () {
    this.setLife(false, true);
};

var CellCollection = function (width, height, side, context) {
  var i = 0;
  var cells = this.cells = [];
  var hash = this.hash = {};
  var c;
  var scaled_w = Math.floor( width / side );
  var scaled_h = Math.floor( height / side );
  this.len_w = scaled_w;
  this.len_h = scaled_h;
  for (var y = 0; y < scaled_h; ++y) {
    for (var x = 0; x < scaled_w; ++x) {
      c = new Cell(x, y, side, i, context, this);
      cells.push( c );
      hash[ ['x', x, '/', 'y', y].join('') ] = c;
      ++i;
    }
  }
};

CellCollection.prototype.locateX = function (x, incr) {
    var _x = x + incr;
    if (_x < 0) {
        _x = this.len_w + (_x % this.len_w);
    }
    else if (_x >= this.len_w) {
        _x = _x % this.len_w;
    }
    return _x;
};

CellCollection.prototype.locateY = function (y, incr) {
    var _y = y + incr;
    if (_y < 0) {
        _y = this.len_h + (_y % this.len_h);
    }
    else if (_y >= this.len_h) {
        _y = _y % this.len_h;
    }
    return _y;
};

CellCollection.prototype.nextLife = function (x, y, current) {
  var density = 0;
  var result = current;
  for (var _y = -1; _y < 2; ++_y) {
      inner:for ( var _x = -1; _x < 2; ++_x) {
          if ( _x === 0 && _y === 0) {
              continue inner;
          }
          var myx = this.locateX(x, _x);
              var myy = this.locateY(y, _y)
          if ( this.getCell(myx, myy).life) {
              ++density;
          }
      }
  }
  if (density < 2) {
      result = false;
  }
  else if ( density === 2) {
      result = result;
  }
  else if ( density === 3) {
        result = true;
  }
  else if (density > 3) {
        result = false;
  }
  // console.log( x, y, density, result );
  return result;
};

CellCollection.prototype.getCell = function (x, y) {
  return this.hash[ ['x', x, '/', 'y', y].join('') ];
};

CellCollection.prototype.turn = function () {
  for (var i = 0, len = this.cells.length; i < len; ++i) {
      this.cells[i].copyFuture();
      this.cells[i].next();
  }
  this.render(true);
};

CellCollection.prototype.render = function (isTurning) {
  var i, len;
  for (i = 0, len = this.cells.length; i < len; ++i) {
    this.cells[i].render(isTurning);
  }
};

// ===============================================

var GameView = window.GameView = function (elm) {
  var $canvas = $(elm);
  var self = this;
  this.multiplier = 1;
  this.width = elm.width = Math.floor( $canvas.width() / this.multiplier );
  this.height = elm.height = Math.floor( $canvas.height() / this.multiplier );

  this.status = $('#status')[0];
  this.generation = $('#generation')[0];
  this.context = elm.getContext('2d');
  // this.context.imageSmoothingEnabled = false;

  // not sure i wanna do this side here??
  this.side = 10;
  this.cells = new CellCollection(this.width, this.height, this.side, this.context);
  this.cells.render();

  $canvas.on( 'click', function (ev) {
    var offset = $canvas.offset();
    var x = Math.floor( Math.round(ev.clientX - offset.left) / self.side );
    var y = Math.floor( Math.round(ev.clientY - offset.top) / self.side );
    var cell = self.cells.getCell(x, y);
    console.log( x, y );
    ev.preventDefault();
    ev.stopPropagation();
    cell.setLife( !cell.life, true );
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

var Board = window.Board = function (view) {
  this.generation = 0;
  this.isRunning = false;
  this.handler = -1;
  this.onInterval = $.proxy( this._onInterval, this );
  this.determineInterval();

  this.view = view;
  this.cells = view.cells;
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

Board.prototype.wipe = function () {
    // weird!!
  for (var i = 0, len = this.cells.cells.length; i < len; ++i) {
    this.cells.cells[i].die();
  }
  this.cells.render();
};

Board.prototype._onInterval = function () {
  ++this.generation;
  this.view.showGeneration( this.generation );
  this.cells.turn();

//    this.turnOff();
  // if (this.generation % 5 === 0) {
  //     this.turnOff();
  //     return;
  // }
};


