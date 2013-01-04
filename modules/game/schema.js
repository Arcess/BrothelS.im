var Game = function(obj) {
  // Update old fetish settings
  if (obj.tentacles !== undefined) {
    obj.fetishes = { tentacles: obj.tentacles };
    delete obj.tentacles;
  }
  // Trim overly-long old histories
  if (obj.moneyHistory.length > Game.config.moneyHistoryLength) {
    obj.moneyHistory = obj.moneyHistory.slice(obj.moneyHistory.length - Game.config.moneyHistoryLength);
  }
  $.extend(this, obj);
};

Game.prototype.nextPayment = function() {
  if (this.day >= Game.config.gameLength) { return false; }
  var pl = Game.config.paymentLength;
  var day = Math.floor(this.day / pl) * pl + pl;
  var increments = Game.config.gameLength / pl;
  var increment_size = Game.config.loan / (increments + 1) / increments * 2;
  var amount = increment_size * day / pl;
  return {day: day, amount: Math.round(amount)};
};

Game.prototype.render = function() {
  $('#content').html(ejs.render($('#game_view_template').html(), {
    g: g,
    gameLength: Game.config.gameLength
  }));
  $('#next').click(function() {
    g.nextTurn();
  });
  e.invokeAll('GameRender', function() {
    e.invokeAll('Autorender', function() {}, $('#content'));
  });
};

Game.prototype.nextTurn = function() {
  this.moneyHistory.push(this.money);
  if (this.moneyHistory.length > Game.config.moneyHistoryLength) {
    this.moneyHistory = this.moneyHistory.slice(this.moneyHistory.length - Game.config.moneyHistoryLength);
  }
  var game = this;
  e.invokeAll('GamePreDay', function() {
    e.invokeAll('GameNextDay', function() {
      var payment = game.nextPayment();
      game.day += 1;
      var done = function() {
        if (payment && game.day == payment.day) {
          game.money -= payment.amount;
        }
        game.render();
      };
      e.invokeAll('GamePostDay', done);
    });
  });
};

Game.prototype.toJSONString = function() {
  return JSON.stringify(g, function(key, val) {
    if (key == '_') {
      return undefined;
    }
    return val;
  });
};