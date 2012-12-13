Girl.prototype.maxCustomers = function() {
  var libido = this['soft libido'] + this['hard libido'];
  libido += this['anal libido'] + this['fetish libido'];
  libido /= 4;
  libido += this.constitution * 3;
  return Math.floor(libido / 300 * Actions.Streetwalk.config.maxCustomers);
};

Girl.prototype.checkInterest = function(type) {
  var interest = this.obedience * 2 + this[type + ' libido'] * 2;
  interest += this[type + ' experience'] + this.happiness / 2;
  interest = (interest / 500 + Math.random());
  interest -= Actions.Streetwalk.config.types[type].r;
  return Math.max(interest, 0);
};

(function() {
  Girl.actionFunctions.Streetwalk = function(time) {
    var context = {
      girl: this,
      Str: Game.strings
    };
    var endDelta = this.startDelta();
    this.apply(Actions.Streetwalk.config.streetwalkDelta);
    if (!this.actions.soft && !this.actions.hard && !this.actions.anal && !this.actions.fetish) {
      new Message({
        type: 'Confused',
        time: time,
        image: this.image('base', true),
        text: ejs.render(Actions.Streetwalk.config.confused, context),
        delta: endDelta()
      }).save(this.name);
      return;
    }
    new Message({
      type: 'Streetwalk',
      time: time,
      image: this.image('base', true),
      text: ejs.render(Actions.Streetwalk.config.action, context),
      delta: endDelta()
    }).save(this.name);
    var found = Math.pow(this.charisma / 100, 0.5);
    found *= (Math.random() / 2 + 0.5);
    found = Math.ceil(found * this.maxCustomers());

    for (var i = 0; i < found; i++) {
      doCustomer.call(this, time);
    }
  };

  function doCustomer(time) {
    var customer = randomPerson('Very Low Class');
    var context = {
      girl: this,
      customer: customer,
      Str: Game.strings
    };
    customer.satisfaction = 1;
    var endDelta = this.startDelta();
    var sex = '';
    for (var i in customer.sex) {
      sex = customer.sex[i];
      if (this.actions[sex]) {
        break;
      }
      customer.satisfaction -= 0.25;
    }
    context.sex = sex;
    var interest = this.checkInterest(sex);
    if (interest === 0) {
      context.result = ejs.render(Actions.Streetwalk.config.uncooperative, context);
      this.apply(Actions.Streetwalk.config.refuseDelta);
      new Message({
        type: 'Refused',
        time: time,
        image: this.image('refuse', true),
        text: ejs.render(Actions.Streetwalk.config.message, context),
        delta: endDelta()
      }).save(this.name);
      return;
    }
    customer.satisfaction *= interest;
    customer.satisfaction += this.charisma / 200;
    customer.satisfaction += this.get(customer.wants[0]) / 150;
    customer.satisfaction += this.get(customer.wants[1]) / 300;
    if (this.happiness < 50) {
      customer.satisfaction *= this.happiness / 100 + 0.5;
    }
    var sexInfo = Actions.Streetwalk.config.types[sex];
    var pays = Math.floor(customer.satisfaction * sexInfo.pays);

    var endurance = sexInfo.endurance;
    endurance *= 1 - this.constitution / 200;
    this.apply('endurance', endurance);
    var expChance = 1 - Game.config.expRate * (this.intelligence / 100);
    expChance = Math.pow(Math.random(), expChance);
    if (expChance > this[sex + ' experience'] / 100) {
      this.apply(sex + ' experience', 1);
    }
    if (this['hard experience'] + this['anal experience'] + this['fetish experience'] === 0) {
      pays *= 5;
      context.result = Actions.Streetwalk.config.virgin;
    }
    else {
      context.result = Math.choice(Actions.Streetwalk.config.results[sex]);
    }
    g.money += pays;
    new Message({
      type: 'Prostitution',
      time: time,
      image: this.image(sex, true),
      text: ejs.render(Actions.Streetwalk.config.message, context),
      delta: endDelta()
    }).save(this.name);
  }
})();
