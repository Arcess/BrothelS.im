function Mission(obj) {
  Resolvable.call(this, obj);
}

Mission.prototype = new Resolvable();

Mission.create = function(_id, context) {
  var mission = Resolvable.create(_id, 'Mission', context);
  if (!mission) { return mission; }
  var base = mission.base();
  if (typeof(mission.end) == 'function') {
    delete mission.end;
  } else if (mission.end) {
    mission.end = mission.parseConditions(mission.end, context);
  }
  if (mission.display) {
    mission.display = new Message(mission.display, mission.context());
    g.messages.push(mission.display);
  }
  return mission;
};

Mission.prototype.getEnd = function() {
  if (this.end) {
    return this.end;
  } else if (typeof(this.base().end) == 'function') {
    return this.base().end.call(this, this.context());
  }
};

Mission.prototype.checkDay = function(done) {
  var mission = this;
  var conditions = this.getEnd() || {};
  var result = this.checkConditions(conditions);
  if (result) {
    mission.setContext(result);
    delete g.missions[mission._id];
    g.missionsDone[mission._id] = true;
    mission.applyResults(done);
    return;
  }
  if (mission.display && conditions.max && conditions.max.day && conditions.max.day - 1 == g.day) {
    g.messages.push(mission.display);
  }
  done();
};