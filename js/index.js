(function() {
  var Banner, Cell, Node, banners, cellWasCaptured, cells, createNodes, currentNode, drawBanners, drawField, drawLine, field, game, gameState, getFieldSettings, getGameSettings, getGameState, getStyles, initCells, initNodes, link, mainSvgEl, mouseClickCancelHandler, mouseClickConfirmHandler, mouseClickNodeHandler, mouseMoveHandler, mouseOutNodeHandler, mouseOverNodeHandler, nodeWasClicked, nodes, paper, previousLink, styles, tempLine;

  mainSvgEl = document.querySelector('#svg');

  paper = Snap('#svg');

  getFieldSettings = function() {
    var elemStyle, ref, ref1, s, settings;
    elemStyle = getComputedStyle(mainSvgEl);
    settings = {
      width: (ref = parseInt(elemStyle.width)) != null ? ref : 600,
      height: (ref1 = parseInt(elemStyle.height)) != null ? ref1 : 600,
      numOfRows: 6,
      numOfCols: 6,
      circleRad: 30,
      lineColor: '#000',
      pseudoLineColor: '#ddd'
    };
    s = settings;
    s.innerCircleRad = s.circleRad / 4;
    s.lineWidth = Math.min(s.width / s.numOfRows, s.height / s.numOfCols) / 10;
    s.cellWidth = (s.width - s.lineWidth * (s.numOfRows + 1)) / s.numOfRows;
    s.cellHeight = (s.height - s.lineWidth * (s.numOfCols + 1)) / s.numOfCols;
    s.clickedCircleRad = s.circleRad * 0.6;
    return settings;
  };

  field = getFieldSettings();

  getGameSettings = function() {
    var game;
    return game = {
      numOfPlayers: 2,
      playersColors: ['#CC0000', '#4682B4'],
      nameOfPlayers: ['THE RED ONE', 'THE BLUE ONE'],
      defaultPlayerColor: '#708090',
      roundDuration: 30,
      firstMove: 1
    };
  };

  game = getGameSettings();

  getGameState = function() {
    var gameState, gs, i, k, ref;
    gs = gameState = {};
    gs.turn = game.firstMove;
    gs.capturedCells = [];
    for (i = k = 1, ref = game.numOfPlayers; 1 <= ref ? k <= ref : k >= ref; i = 1 <= ref ? ++k : --k) {
      gs.capturedCells[i] = 0;
    }
    gs.update = function() {
      gs.capturedCells[gs.turn]++;
      return banners[gs.turn].updateScore();
    };
    gs.changeTurn = function() {
      banners.changeTurn(gs.turn);
      if (++gs.turn > game.numOfPlayers) {
        return gs.turn = 1;
      }
    };
    return gameState;
  };

  gameState = getGameState();

  banners = [];

  Banner = (function() {
    var count;

    count = 0;

    function Banner(bannerStyle) {
      var height, ref, svgEl, sw, width;
      this.textStyle = styles.textStyle;
      svgEl = document.getElementById("player" + (++count));
      width = this.width = svgEl.style.width = 100;
      height = this.height = svgEl.style.height = 200;
      sw = (ref = bannerStyle.strokeWidth) != null ? ref : 0;
      this.paper = Snap(svgEl);
      this.banner = this.paper.path("M " + (sw / 2) + "," + (sw / 2) + " L " + (width - sw / 2) + "," + (sw / 2) + " L " + (width - sw / 2) + "," + (3 * height / 4 - sw / 2) + " L " + (width / 2) + "," + (height - sw) + " L " + (sw / 2) + "," + (3 * height / 4 - sw / 2) + " Z").attr(bannerStyle);
      if (count !== game.firstMove) {
        this.banner.attr({
          opacity: 0.4
        });
      }
      this.score = this.paper.text(width / 2, height / 2, "0").attr(this.textStyle);
    }

    Banner.prototype.updateScore = function() {
      var gs, turn;
      gs = gameState;
      turn = gs.turn;
      return this.score.stop().animate({
        opacity: 0
      }, 200, mina.easeinout, (function(_this) {
        return function() {
          _this.score.remove();
          return _this.score = _this.paper.text(_this.width / 2, _this.height / 2, gs.capturedCells[turn]).attr(_this.textStyle).stop().animate({
            opacity: 1
          }, 500, mina.easeinout);
        };
      })(this));
    };

    return Banner;

  })();

  banners.changeTurn = function(turn) {
    this[turn].banner.stop().animate({
      opacity: 0.4
    }, 500, mina.easeinout);
    if (++turn > game.numOfPlayers) {
      turn = 1;
    }
    return this[turn].banner.stop().animate({
      opacity: 1
    }, 500, mina.easeinout);
  };

  cellWasCaptured = false;

  Cell = (function() {
    function Cell(i1, j1, countOfSides, owner) {
      this.i = i1;
      this.j = j1;
      this.countOfSides = countOfSides != null ? countOfSides : 0;
      this.owner = owner != null ? owner : null;
      this.rect = {};
    }

    Cell.prototype.update = function() {
      if (++this.countOfSides === 4) {
        this.owner = gameState.turn;
        cellWasCaptured = true;
        this.paintCell();
        return gameState.update();
      }
    };

    Cell.prototype.paintCell = function() {
      return this.rect.stop().animate(styles.playersCellStyle[this.owner - 1], 500, mina.easeinout);
    };

    return Cell;

  })();

  Node = (function() {
    function Node(i1, j1, top, rgt, btm, lft) {
      this.i = i1;
      this.j = j1;
      this.top = top != null ? top : false;
      this.rgt = rgt != null ? rgt : false;
      this.btm = btm != null ? btm : false;
      this.lft = lft != null ? lft : false;
      this.links = [];
      this.count = 0;
    }

    Node.prototype.update = function(link) {
      var f, i, j;
      this[link] = true;
      this.count++;
      f = field;
      i = currentNode.i;
      j = currentNode.j;
      switch (link) {
        case "top":
          cells[i][j].update();
          cells[i][j + 1].update();
          if (i !== 1) {
            nodes[i - 1][j].btm = true;
            return nodes[i - 1][j].count++;
          }
          break;
        case "rgt":
          cells[i][j + 1].update();
          cells[i + 1][j + 1].update();
          if (f.numOfCols !== j + 1) {
            nodes[i][j + 1].lft = true;
            return nodes[i][j + 1].count++;
          }
          break;
        case "btm":
          cells[i + 1][j].update();
          cells[i + 1][j + 1].update();
          if (i + 1 !== f.numOfRows) {
            nodes[i + 1][j].top = true;
            return nodes[i + 1][j].count++;
          }
          break;
        case "lft":
          cells[i][j].update();
          cells[i + 1][j].update();
          if (j !== 1) {
            nodes[i][j - 1].rgt = true;
            return nodes[i][j - 1].count++;
          }
      }
    };

    return Node;

  })();

  initCells = function() {
    var cell, cells, cols, i, j, k, l, ref, ref1, rows;
    cells = [];
    rows = field.numOfRows;
    cols = field.numOfCols;
    for (i = k = 1, ref = rows; 1 <= ref ? k <= ref : k >= ref; i = 1 <= ref ? ++k : --k) {
      cells[i] = [];
      for (j = l = 1, ref1 = cols; 1 <= ref1 ? l <= ref1 : l >= ref1; j = 1 <= ref1 ? ++l : --l) {
        cell = cells[i][j] = new Cell(i, j);
        if (i === 1 || i === rows) {
          cell.countOfSides++;
        }
        if (j === 1 || j === cols) {
          cell.countOfSides++;
        }
      }
    }
    return cells;
  };

  cells = initCells();

  initNodes = function() {
    var cols, i, j, k, l, nodes, ref, ref1, rows;
    nodes = [];
    rows = field.numOfRows;
    cols = field.numOfCols;
    for (i = k = 1, ref = rows; 1 <= ref ? k < ref : k > ref; i = 1 <= ref ? ++k : --k) {
      nodes[i] = [];
      for (j = l = 1, ref1 = cols; 1 <= ref1 ? l < ref1 : l > ref1; j = 1 <= ref1 ? ++l : --l) {
        nodes[i][j] = new Node(i, j);
      }
    }
    return nodes;
  };

  nodes = initNodes();

  getStyles = function() {
    var f, g, i, k, l, ref, ref1, s, styles;
    s = styles = {};
    f = field;
    g = game;
    s.rectStyle = {
      "fill-opacity": 0,
      stroke: f.lineColor,
      strokeWidth: f.lineWidth
    };
    s.pseudoRectStyle = {
      "fill-opacity": 0,
      strokeWidth: 0
    };
    s.pseudoLineStyle = {
      strokeWidth: f.lineWidth,
      stroke: f.pseudoLineColor,
      "stroke-opacity": 0.6
    };
    s.lineStyle = {
      strokeWidth: f.lineWidth,
      stroke: f.lineColor,
      "stroke-opacity": 1
    };
    s.circleStyle = {
      strokeWidth: 0,
      fill: f.pseudoLineColor,
      "fill-opacity": 0
    };
    s.smallCircleStyle = {
      strokeWidth: 0,
      fill: f.lineColor
    };
    s.textStyle = {
      fill: '#fff',
      stroke: '#aaa',
      fontSize: '60px',
      opacity: 1,
      "text-anchor": "middle"
    };
    s.playersCellStyle = [];
    for (i = k = 0, ref = g.numOfPlayers; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      s.playersCellStyle[i] = {
        fill: g.playersColors[i],
        "fill-opacity": 1
      };
    }
    s.bannersStyle = [];
    for (i = l = 0, ref1 = g.numOfPlayers; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
      s.bannersStyle[i] = {
        fill: g.playersColors[i],
        strokeWidth: 10,
        stroke: '#eee'
      };
    }
    return styles;
  };

  styles = getStyles();

  drawBanners = function() {
    var i, k, ref, results;
    results = [];
    for (i = k = 0, ref = game.numOfPlayers; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      results.push(banners[i + 1] = new Banner(styles.bannersStyle[i]));
    }
    return results;
  };

  drawBanners();

  drawLine = function(x, y, x1, y1, style) {
    return paper.path("M " + x + "," + y + " L " + x1 + "," + y1).attr(style);
  };

  drawField = function() {
    var cols, f, height, i, j, k, l, line, m, n, o, p, ref, ref1, ref2, ref3, ref4, ref5, rows, width, x, xx, y, yy;
    f = field;
    rows = field.numOfRows;
    cols = field.numOfCols;
    for (i = k = 1, ref = rows; 1 <= ref ? k <= ref : k >= ref; i = 1 <= ref ? ++k : --k) {
      for (j = l = 1, ref1 = cols; 1 <= ref1 ? l <= ref1 : l >= ref1; j = 1 <= ref1 ? ++l : --l) {
        x = (j - 1) * (f.cellWidth + f.lineWidth) + f.lineWidth / 2;
        y = (i - 1) * (f.cellHeight + f.lineWidth) + f.lineWidth / 2;
        width = f.cellWidth + f.lineWidth;
        height = f.cellHeight + f.lineWidth;
        cells[i][j].rect = paper.rect(x, y, width, height).attr(styles.pseudoRectStyle);
      }
    }
    for (i = m = 1, ref2 = f.numOfRows; 1 <= ref2 ? m < ref2 : m > ref2; i = 1 <= ref2 ? ++m : --m) {
      y = i * (f.cellHeight + f.lineWidth) + f.lineWidth / 2;
      for (j = n = 1, ref3 = f.numOfCols; 1 <= ref3 ? n <= ref3 : n >= ref3; j = 1 <= ref3 ? ++n : --n) {
        x = (j - 1) * (f.cellWidth + f.lineWidth) + f.lineWidth / 2;
        xx = x + (f.cellWidth + f.lineWidth);
        line = drawLine(x, y, xx, y, styles.pseudoLineStyle);
        if (j !== f.numOfCols) {
          nodes[i][j].links['lft'] = line;
        }
        if (j !== 1) {
          nodes[i][j - 1].links['rgt'] = line;
        }
      }
    }
    for (j = o = 1, ref4 = f.numOfCols; 1 <= ref4 ? o < ref4 : o > ref4; j = 1 <= ref4 ? ++o : --o) {
      x = j * (f.cellWidth + f.lineWidth) + f.lineWidth / 2;
      for (i = p = 1, ref5 = f.numOfRows; 1 <= ref5 ? p <= ref5 : p >= ref5; i = 1 <= ref5 ? ++p : --p) {
        y = (i - 1) * (f.cellHeight + f.lineWidth) + f.lineWidth / 2;
        yy = y + (f.cellWidth + f.lineWidth);
        line = drawLine(x, y, x, yy, styles.pseudoLineStyle);
        if (i !== f.numOfRows) {
          nodes[i][j].links['top'] = line;
        }
        if (i !== 1) {
          nodes[i - 1][j].links['btm'] = line;
        }
      }
    }
    f.rect = paper.rect(f.lineWidth / 2, f.lineWidth / 2, f.width - f.lineWidth, f.height - f.lineWidth).attr(styles.rectStyle);
  };

  drawField();

  nodeWasClicked = false;

  currentNode = {};

  tempLine = [];

  link = previousLink = null;

  mouseMoveHandler = function(e) {
    var dx, dy, f, x, xx, y, yy;
    f = field;
    xx = e.offsetX;
    yy = e.offsetY;
    x = currentNode.x;
    y = currentNode.y;
    dx = xx - x;
    dy = yy - y;
    link = (dx > 0 && dy < 0 ? Math.abs(dx) > Math.abs(dy) ? "rgt" : "top" : dx > 0 && dy > 0 ? Math.abs(dx) > Math.abs(dy) ? "rgt" : "btm" : dx < 0 && dy > 0 ? Math.abs(dx) > Math.abs(dy) ? "lft" : "btm" : dx < 0 && dy < 0 ? Math.abs(dx) > Math.abs(dy) ? "lft" : "top" : void 0);
    if (previousLink === link || (link == null)) {
      return;
    }
    if (!(previousLink === null || currentNode[previousLink])) {
      tempLine.attr(styles.pseudoLineStyle);
    }
    tempLine = currentNode.links[link];
    if (!currentNode[link]) {
      tempLine.attr(styles.lineStyle);
    }
    previousLink = link;
  };

  mouseClickConfirmHandler = function(e) {
    var previousTempLine;
    if (link === null || currentNode[link]) {
      return;
    }
    currentNode.update(link);
    if (!cellWasCaptured) {
      gameState.changeTurn();
    } else {
      cellWasCaptured = false;
    }
    currentNode.group.innerCircle.stop().animate({
      r: field.innerCircleRad
    }, 100, mina.easeinout);
    nodeWasClicked = false;
    link = previousLink = null;
    tempLine = previousTempLine = [];
    currentNode = {};
    paper.unmousemove(mouseMoveHandler);
    paper.unclick(mouseClickConfirmHandler);
  };

  mouseClickCancelHandler = function(e) {
    var previousTempLine;
    e.preventDefault();
    if (!nodeWasClicked) {
      return;
    }
    if (!(link === null || currentNode[link])) {
      tempLine.attr(styles.pseudoLineStyle);
    }
    currentNode.group.innerCircle.stop().animate({
      r: field.innerCircleRad
    }, 100, mina.easeinout);
    nodeWasClicked = false;
    link = previousLink = null;
    tempLine = previousTempLine = [];
    currentNode = {};
    paper.unmousemove(mouseMoveHandler);
    return paper.unclick(mouseClickConfirmHandler);
  };

  mainSvgEl.addEventListener('contextmenu', mouseClickCancelHandler);

  mouseClickNodeHandler = function(e) {
    if (link !== null) {
      return;
    }
    if (this.containedNode.count === 4) {
      return;
    }
    this.innerCircle.stop().animate({
      r: field.clickedCircleRad
    }, 100, mina.elastic);
    nodeWasClicked = true;
    currentNode = this.containedNode;
    paper.mousemove(mouseMoveHandler);
    paper.click(mouseClickConfirmHandler);
  };

  mouseOverNodeHandler = function() {
    if (this.containedNode.count === 4) {
      return;
    }
    if (!nodeWasClicked) {
      return this.innerCircle.stop().animate({
        r: field.clickedCircleRad
      }, 300, mina.elastic);
    }
  };

  mouseOutNodeHandler = function() {
    if (this.containedNode.count === 4) {
      return;
    }
    if (!nodeWasClicked) {
      return this.innerCircle.stop().animate({
        r: field.innerCircleRad
      }, 100, mina.easeinout);
    }
  };

  createNodes = function() {
    var circle, f, group, i, innerCircle, j, k, l, ref, ref1, x, y;
    f = field;
    for (i = k = 1, ref = f.numOfRows; 1 <= ref ? k < ref : k > ref; i = 1 <= ref ? ++k : --k) {
      y = i * (f.cellHeight + f.lineWidth) + f.lineWidth / 2;
      for (j = l = 1, ref1 = f.numOfCols; 1 <= ref1 ? l < ref1 : l > ref1; j = 1 <= ref1 ? ++l : --l) {
        x = j * (f.cellWidth + f.lineWidth) + f.lineWidth / 2;
        circle = paper.circle(x, y, f.circleRad).attr(styles.circleStyle);
        innerCircle = paper.circle(x, y, f.innerCircleRad).attr(styles.smallCircleStyle);
        group = paper.g(circle, innerCircle);
        group.innerCircle = innerCircle;
        group.containedNode = nodes[i][j];
        nodes[i][j].group = group;
        group.containedNode.x = x;
        group.containedNode.y = y;
        group.mouseover(mouseOverNodeHandler);
        group.mouseout(mouseOutNodeHandler);
        group.click(mouseClickNodeHandler);
      }
    }
  };

  createNodes();

}).call(this);