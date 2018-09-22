(function () {
  'use strict';

  const Easing = {
      linear: function (t) { return t; },
      easeInQuad: function (t) { return t * t; },
      easeOutQuad: function (t) { return t * (2 - t); },
      easeInOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
      easeInCubic: function (t) { return t * t * t; },
      easeOutCubic: function (t) { return (--t) * t * t + 1; },
      easeInOutCubic: function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
      easeInQuart: function (t) { return t * t * t * t; },
      easeOutQuart: function (t) { return 1 - (--t) * t * t * t; },
      easeInOutQuart: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; },
      easeInQuint: function (t) { return t * t * t * t * t; },
      easeOutQuint: function (t) { return 1 + (--t) * t * t * t * t; },
      easeInOutQuint: function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t; }
  };
  class Animator {
      constructor(controls, durationMs, easing) {
          this.controls = controls;
          this.durationMs = durationMs;
          this.easing = easing;
          this.loop = false;
          this.startTime = 0;
          this.durationMs = this.durationMs || 500;
          this.easing = this.easing || Easing.linear;
      }
      start() {
          this.startTime = 0;
          this.controls[0].form().addAnimator(this);
          return new Promise((resolve) => {
              this._resolve = resolve;
          });
      }
      stop() {
          this.controls[0].form().removeAnimator(this);
          if (this._resolve) {
              this._resolve();
              this._resolve = null;
          }
      }
      apply(frameTimeMs) {
          if (this.startTime === 0) {
              this.startTime = frameTimeMs;
          }
          const t = Math.min(1, (frameTimeMs - this.startTime) / this.durationMs);
          this.update(this.easing(Math.min(1, t)));
          if (frameTimeMs >= this.startTime + this.durationMs) {
              if (this.loop) {
                  this.startTime = 0;
              }
              else {
                  this.stop();
              }
          }
      }
  }
  //# sourceMappingURL=animator.js.map

  class CoordAnimator extends Animator {
      constructor(constraint, min, max, duration, easing) {
          super(constraint.controls, duration, easing);
          this.constraint = constraint;
          this.min = min;
          this.max = max;
      }
      update(t) {
          this.constraint.set(Math.round(this.min + (this.max - this.min) * t));
          this.controls[0].relayout();
      }
  }
  //# sourceMappingURL=coord.js.map

  class OpacityAnimator extends Animator {
      constructor(control, min, max, duration, easing) {
          super([control], duration, easing);
          this.min = min;
          this.max = max;
      }
      update(t) {
          this.controls[0].opacity = this.min + (this.max - this.min) * t;
          this.controls[0].repaint();
      }
  }
  //# sourceMappingURL=opacity.js.map

  //# sourceMappingURL=index.js.map

  var CoordAxis;
  (function (CoordAxis) {
      CoordAxis[CoordAxis["X"] = 1] = "X";
      CoordAxis[CoordAxis["Y"] = 2] = "Y";
  })(CoordAxis || (CoordAxis = {}));
  var CoordType;
  (function (CoordType) {
      CoordType[CoordType["A"] = 1] = "A";
      CoordType[CoordType["B"] = 2] = "B";
      CoordType[CoordType["C"] = 3] = "C";
      CoordType[CoordType["D"] = 4] = "D";
      CoordType[CoordType["E"] = 5] = "E";
  })(CoordType || (CoordType = {}));
  class Coord {
      constructor(axis, type) {
          this.axis = axis;
          this.type = type;
          this.name = this.toString();
      }
      isParentDependent() {
          return (this.type === CoordType.C || this.type === CoordType.E);
      }
      toString() {
          if (this.axis === CoordAxis.X) {
              return { 1: 'X', 2: 'W', 3: 'X2', 4: 'XW', 5: 'X2W' }[this.type];
          }
          else if (this.axis === CoordAxis.Y) {
              return { 1: 'Y', 2: 'H', 3: 'Y2', 4: 'YH', 5: 'Y2H' }[this.type];
          }
          else {
              return '?';
          }
      }
      static create(axis, type) {
          for (const c of Coord.All) {
              if (c.axis === axis && c.type === type) {
                  return c;
              }
          }
          throw new Error('Unknown axis/type combination.');
      }
  }
  Coord.X = new Coord(CoordAxis.X, CoordType.A);
  Coord.Y = new Coord(CoordAxis.Y, CoordType.A);
  Coord.W = new Coord(CoordAxis.X, CoordType.B);
  Coord.H = new Coord(CoordAxis.Y, CoordType.B);
  Coord.X2 = new Coord(CoordAxis.X, CoordType.C);
  Coord.Y2 = new Coord(CoordAxis.Y, CoordType.C);
  Coord.XW = new Coord(CoordAxis.X, CoordType.D);
  Coord.YH = new Coord(CoordAxis.Y, CoordType.D);
  Coord.X2W = new Coord(CoordAxis.X, CoordType.E);
  Coord.Y2H = new Coord(CoordAxis.Y, CoordType.E);
  Coord.All = [
      Coord.X, Coord.Y, Coord.W, Coord.H, Coord.X2, Coord.Y2, Coord.XW, Coord.YH, Coord.X2W, Coord.Y2H
  ];
  //# sourceMappingURL=enums.js.map

  class Constraint {
      constructor(controls, coords) {
          this.controls = controls;
          this.coords = coords;
          this.order = 0;
          if (controls.length !== coords.length) {
              throw new Error('Mismatched controls and coords.');
          }
          this.controls = this.controls.slice();
          this.coords = this.coords.slice();
          for (let i = 0; i < this.controls.length; ++i) {
              this.controls[i].refConstraint(this, this.coords[i].axis);
          }
          this.parent = controls[0].parent;
          for (const c of controls) {
              if (!c.parent) {
                  throw new Error('Control must be added to parent before constraining.');
              }
              if (c.parent != this.parent) {
                  throw new Error('All controls in the same constraint must share the same parent.');
              }
          }
          this.parent.childConstraints.push(this);
          this.parent.relayout();
      }
      remove() {
          for (let i = 0; i < this.controls.length; ++i) {
              this.controls[i].unrefConstraint(this, this.coords[i].axis);
          }
          if (this.parent) {
              for (let i = 0; i < this.parent.childConstraints.length; ++i) {
                  if (this.parent.childConstraints[i] === this) {
                      this.parent.childConstraints.splice(i, 1);
                      this.parent.relayout();
                      return;
                  }
              }
          }
      }
      static setCoord(control, coord, v) {
          if (v - Math.floor(v) > 0.001) {
              console.log('Non-integer coord value.');
          }
          v = Math.floor(v);
          if (coord === Coord.X) {
              if (control.x !== null) {
                  throw new Error('Overspecified coordinate: x');
              }
              control.x = v;
          }
          else if (coord === Coord.Y) {
              if (control.y !== null) {
                  throw new Error('Overspecified coordinate: y');
              }
              control.y = v;
          }
          else if (coord === Coord.W) {
              if (control.w !== null) {
                  throw new Error('Overspecified coordinate: w');
              }
              control.w = v;
          }
          else if (coord === Coord.H) {
              if (control.h !== null) {
                  throw new Error('Overspecified coordinate: h');
              }
              control.h = v;
          }
          else if (coord === Coord.X2) {
              if (control.x2 !== null) {
                  throw new Error('Overspecified coordinate: x2');
              }
              control.x2 = v;
          }
          else if (coord === Coord.Y2) {
              if (control.y2 !== null) {
                  throw new Error('Overspecified coordinate: y2');
              }
              control.y2 = v;
          }
          else if (coord === Coord.XW) {
              if (control.xw !== null) {
                  throw new Error('Overspecified coordinate: xw');
              }
              control.xw = v;
          }
          else if (coord === Coord.YH) {
              if (control.yh !== null) {
                  throw new Error('Overspecified coordinate: yh');
              }
              control.yh = v;
          }
          else if (coord === Coord.X2W) {
              if (control.x2w !== null) {
                  throw new Error('Overspecified coordinate: x2w');
              }
              control.x2w = v;
          }
          else if (coord === Coord.Y2H) {
              if (control.y2h !== null) {
                  throw new Error('Overspecified coordinate: y2h');
              }
              control.y2h = v;
          }
          control.recalculate(coord.axis);
      }
      static getCoord(control, coord) {
          if (coord === Coord.X) {
              return control.x;
          }
          else if (coord === Coord.Y) {
              return control.y;
          }
          else if (coord === Coord.W) {
              return control.w;
          }
          else if (coord === Coord.H) {
              return control.h;
          }
          else if (coord === Coord.X2) {
              return control.x2;
          }
          else if (coord === Coord.Y2) {
              return control.y2;
          }
          else if (coord === Coord.XW) {
              return control.xw;
          }
          else if (coord === Coord.YH) {
              return control.yh;
          }
          else if (coord === Coord.X2W) {
              return control.x2w;
          }
          else if (coord === Coord.Y2H) {
              return control.y2h;
          }
      }
      apply() {
          for (let i = 0; i < this.controls.length; ++i) {
              this.controls[i].constraintApplied(this.coords[i].axis);
          }
          return true;
      }
      done(round) {
          return true;
      }
      static drawCoord(ctx, color, control, coord, offset) {
          let xmid = control.x + Math.round(control.w / 3);
          let ymid = control.y + Math.round(control.h / 3);
          if (coord.axis === CoordAxis.X) {
              ymid += offset;
          }
          else if (coord.axis === CoordAxis.Y) {
              xmid += offset;
          }
          if (coord === Coord.X) {
              Constraint.drawConstraint(ctx, color, 0, ymid, control.x, ymid);
          }
          else if (coord === Coord.Y) {
              Constraint.drawConstraint(ctx, color, xmid, 0, xmid, control.y);
          }
          else if (coord === Coord.W) {
              Constraint.drawConstraint(ctx, color, control.x, ymid, control.xw, ymid);
          }
          else if (coord === Coord.H) {
              Constraint.drawConstraint(ctx, color, xmid, control.y, xmid, control.yh);
          }
          else if (coord === Coord.X2) {
              Constraint.drawConstraint(ctx, color, control.parent.w, ymid, control.xw, ymid);
          }
          else if (coord === Coord.Y2) {
              Constraint.drawConstraint(ctx, color, xmid, control.parent.h, xmid, control.yh);
          }
          else if (coord === Coord.XW) {
              Constraint.drawConstraint(ctx, color, 0, ymid, control.xw, ymid);
          }
          else if (coord === Coord.YH) {
              Constraint.drawConstraint(ctx, color, xmid, 0, xmid, control.yh);
          }
          else if (coord === Coord.X2W) {
              Constraint.drawConstraint(ctx, color, control.parent.w, ymid, control.x, ymid);
          }
          else if (coord === Coord.Y2H) {
              Constraint.drawConstraint(ctx, color, xmid, control.parent.h, xmid, control.y);
          }
          else {
              console.log('Unable to draw static constraint on ', coord);
          }
      }
      static drawConstraint(ctx, color, x1, y1, x2, y2) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          let t1 = x1;
          let t2 = x2;
          x1 = Math.min(t1, t2);
          x2 = Math.max(t1, t2);
          t1 = y1;
          t2 = y2;
          y1 = Math.min(t1, t2);
          y2 = Math.max(t1, t2);
          ctx.beginPath();
          if (y1 === y2) {
              ctx.moveTo(x1, y1);
              ctx.lineTo(x1 + 6, y1 + 6);
              ctx.lineTo(x1 + 6, y1 - 6);
              ctx.lineTo(x1, y1);
              ctx.moveTo(x1 + 6, y1);
              ctx.lineTo(x2 - 6, y2);
              ctx.lineTo(x2 - 6, y2 + 6);
              ctx.lineTo(x2, y2);
              ctx.lineTo(x2 - 6, y2 - 6);
              ctx.lineTo(x2 - 6, y2);
          }
          else if (x1 === x2) {
              ctx.moveTo(x1, y1);
              ctx.lineTo(x1 + 6, y1 + 6);
              ctx.lineTo(x1 - 6, y1 + 6);
              ctx.lineTo(x1, y1);
              ctx.moveTo(x1, y1 + 6);
              ctx.lineTo(x2, y2 - 6);
              ctx.lineTo(x2 - 6, y2 - 6);
              ctx.lineTo(x2, y2);
              ctx.lineTo(x2 + 6, y2 - 6);
              ctx.lineTo(x2, y2 - 6);
          }
          else {
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
          }
          ctx.stroke();
      }
  }
  //# sourceMappingURL=constraint.js.map

  class AlignConstraint extends Constraint {
      constructor(control1, coord1, control2, coord2, offset) {
          super([control1, control2], [coord1, coord2]);
          this.control1 = control1;
          this.coord1 = coord1;
          this.control2 = control2;
          this.coord2 = coord2;
          this.offset = offset || 0;
      }
      removeControl(control) {
          if (control !== this.control1 && control !== this.control2) {
              throw new Error('AlignConstraint removed from incorrect control.');
          }
          this.remove();
      }
      apply() {
          let v1 = Constraint.getCoord(this.control1, this.coord1);
          let v2 = Constraint.getCoord(this.control2, this.coord2);
          if (v1 !== null && v2 !== null) {
              throw new Error('Aligning two coordinates that are already specified.');
          }
          if (v1 !== null) {
              Constraint.setCoord(this.control2, this.coord2, v1 - this.offset);
              return super.apply();
          }
          if (v2 !== null) {
              Constraint.setCoord(this.control1, this.coord1, v2 + this.offset);
              return super.apply();
          }
          return false;
      }
      paint(ctx) {
          Constraint.drawCoord(ctx, 'orange', this.control1, this.coord1, 10);
          Constraint.drawCoord(ctx, 'orange', this.control2, this.coord2, 20);
      }
  }
  //# sourceMappingURL=align.js.map

  class FillConstraint extends Constraint {
      constructor(controls, coord, ratios) {
          super(controls, FillConstraint.makeCoords(controls, coord));
          this.ratios = ratios;
          this.lastParentSize = null;
          if (this.coords[0] !== Coord.W && this.coords[0] !== Coord.H) {
              throw new Error('Can only set fill constraints on width/height.');
          }
          if (!this.ratios) {
              this.ratios = [];
              for (const c of this.controls) {
                  this.ratios.push(1);
              }
          }
          if (this.controls.length < 2) {
              throw new Error('Need at least two controls for a fill.');
          }
          if (this.ratios.length !== this.controls.length) {
              throw new Error('Wrong number of ratios for fill.');
          }
          this.total = 100 * this.controls.length;
      }
      static makeCoords(controls, coord) {
          const coords = [];
          for (const c of controls) {
              coords.push(coord);
          }
          return coords;
      }
      removeControl(control) {
          const i = this.controls.indexOf(control);
          if (i < 0) {
              throw new Error('FilLConstraint removed from incorrect control.');
          }
          this.controls.splice(i, 1);
          this.ratios.splice(i, 1);
          control.unrefConstraint(this, this.coords[0].axis);
          if (this.controls.length < 2) {
              this.remove();
          }
      }
      apply() {
          if (this.lastParentSize && this.controls[0].parent.w !== this.lastParentSize) {
              this.total = Math.round(this.total * this.controls[0].parent.w / this.lastParentSize);
              this.lastParentSize = this.controls[0].parent.w;
          }
          let r = this.total % this.controls.length;
          let v = (this.total - r) / this.controls.length;
          for (let i = 0; i < this.controls.length; ++i) {
              const c = this.controls[i];
              if (Constraint.getCoord(c, this.coords[0]) !== null) {
                  throw new Error('Control already has width for fill');
              }
              if (i === 0) {
                  continue;
              }
              let vv = v;
              if (r > 0) {
                  vv += 1;
                  r -= 1;
              }
              Constraint.setCoord(c, this.coords[0], vv);
          }
          return true;
      }
      done(round) {
          let v = Constraint.getCoord(this.controls[0], this.coords[0]);
          let t = v;
          let e = 0;
          for (let i = 1; i < this.controls.length; ++i) {
              const vv = Constraint.getCoord(this.controls[i], this.coords[0]);
              e += Math.abs(v - vv);
              t += vv;
          }
          if (e <= this.controls.length) {
              return true;
          }
          if (round >= 1) {
              t = Math.round((t + this.total) / 2);
          }
          this.total = t;
          this.lastParentSize = this.controls[0].parent.w;
          return false;
      }
      paint(ctx) {
          if (this.coords[0] === Coord.W) {
              for (const c of this.controls) {
                  Constraint.drawCoord(ctx, 'purple', c, Coord.W, 30);
              }
          }
          else if (this.coords[0] === Coord.H) {
              for (const c of this.controls) {
                  Constraint.drawCoord(ctx, 'purple', c, Coord.H, 30);
              }
          }
      }
      static fillParent(controls, axis, spacing) {
          spacing = spacing || 0;
          if (axis === CoordAxis.X) {
              controls[0].coords.x.set(spacing);
              for (let i = 1; i < controls.length; ++i) {
                  controls[i].coords.x.align(controls[i - 1].coords.xw, spacing);
              }
              controls[controls.length - 1].coords.x2.set(spacing);
              return new FillConstraint(controls, Coord.W);
          }
          else if (axis === CoordAxis.Y) {
              controls[0].coords.y.set(spacing);
              for (let i = 1; i < controls.length; ++i) {
                  controls[i].coords.y.align(controls[i - 1].coords.yh, spacing);
              }
              controls[controls.length - 1].coords.y2.set(spacing);
              return new FillConstraint(controls, Coord.H);
          }
      }
  }
  //# sourceMappingURL=fill.js.map

  class StaticConstraint extends Constraint {
      constructor(control, coord, v) {
          super([control], [coord]);
          this.coord = coord;
          if (v - Math.floor(v) > 0.001) {
              console.log('Non-integer value for new static constraint.');
          }
          v = Math.floor(v);
          this.v = v;
      }
      removeControl(control) {
          if (control !== this.controls[0]) {
              throw new Error('StaticConstraint removed from incorrect control.');
          }
          this.remove();
      }
      paint(ctx) {
          Constraint.drawCoord(ctx, 'cornflowerblue', this.controls[0], this.coord, 0);
      }
      apply() {
          if (this.coord.isParentDependent()) {
              if (this.coord.axis === CoordAxis.X && this.parent.w === null) {
                  return false;
              }
              if (this.coord.axis === CoordAxis.Y && this.parent.h === null) {
                  return false;
              }
          }
          Constraint.setCoord(this.controls[0], this.coord, this.v);
          return super.apply();
      }
      set(v) {
          if (v - Math.floor(v) > 0.001) {
              console.log('Non-integer value for updating static constraint.');
          }
          v = Math.floor(v);
          if (this.v !== v) {
              this.v = v;
              this.controls[0].relayout();
          }
      }
      add(dv) {
          if (dv - Math.floor(dv) > 0.001) {
              console.log('Non-integer value added to static constraint.');
          }
          dv = Math.floor(dv);
          this.v += dv;
          this.controls[0].relayout();
      }
      animate(min, max, duration, easing) {
          return new CoordAnimator(this, min, max, duration, easing);
      }
  }
  //# sourceMappingURL=static.js.map

  class ContentConstraint extends Constraint {
      constructor(control, axis, padding, min) {
          super([control], [Coord.create(axis, CoordType.B)]);
          this.padding = padding;
          this.min = min;
          this.padding = this.padding || 0;
          this.min = this.min || 0;
          if (this.coords[0] !== Coord.W && this.coords[0] !== Coord.H) {
              throw new Error('Can only set content constraints on width/height.');
          }
      }
      removeControl(control) {
          if (control !== this.controls[0]) {
              throw new Error('ContentConstraint removed from incorrect control.');
          }
          this.remove();
      }
      paint(ctx) {
          Constraint.drawCoord(ctx, 'green', this.controls[0], this.coords[0], 0);
      }
      apply() {
          let v = 0;
          for (const c of this.controls[0].controls) {
              let cv = 0;
              if (this.coords[0].axis === CoordAxis.X) {
                  cv = Constraint.getCoord(c, Coord.XW);
              }
              else if (this.coords[0].axis === CoordAxis.Y) {
                  cv = Constraint.getCoord(c, Coord.YH);
              }
              if (cv === null) {
                  return false;
              }
              v = Math.max(v, cv);
          }
          Constraint.setCoord(this.controls[0], this.coords[0], Math.max(this.min, v + this.padding));
          return true;
      }
      setPadding(padding) {
          this.padding = padding || 0;
      }
      setMinimum(min) {
          this.min = min || 0;
      }
  }
  //# sourceMappingURL=content.js.map

  class CenterConstraint extends Constraint {
      constructor(control, axis) {
          super([control], [Coord.create(axis, CoordType.A)]);
          this.parentCoord = Coord.create(axis, CoordType.B);
          this.controlCoord = Coord.create(axis, CoordType.B);
      }
      removeControl(control) {
          if (control !== this.controls[0]) {
              throw new Error('CenterConstraint removed from incorrect control.');
          }
          this.remove();
      }
      paint(ctx) {
          Constraint.drawCoord(ctx, 'pink', this.controls[0], this.coords[0], 0);
      }
      apply() {
          const control = this.controls[0];
          const p = Constraint.getCoord(control.parent, this.parentCoord);
          if (p === null) {
              return false;
          }
          const c = Constraint.getCoord(control, this.parentCoord);
          if (c === null) {
              return false;
          }
          Constraint.setCoord(control, this.coords[0], Math.floor((p - c) / 2));
          return super.apply();
      }
  }

  //# sourceMappingURL=index.js.map

  class EventSource {
      constructor(addCallback) {
          this.listeners = [];
          this.addCallback = addCallback;
      }
      fire(data) {
          for (const h of this.listeners) {
              try {
                  h(data);
              }
              catch (ex) {
                  console.log('Exception in event handler', ex);
              }
          }
      }
      add(h) {
          this.listeners.push(h);
          if (this.addCallback) {
              this.addCallback();
          }
      }
  }
  //# sourceMappingURL=events.js.map

  class ControlEvent {
      constructor(control) {
          this.control = control;
      }
  }
  class ControlAtPointData {
      constructor(control, x, y, formX, formY) {
          this.control = control;
          this.x = x;
          this.y = y;
          this.formX = formX;
          this.formY = formY;
          this.startX = formX;
          this.startY = formY;
      }
      update(formX, formY) {
          const dx = formX - this.formX;
          const dy = formY - this.formY;
          this.x += formX - this.formX;
          this.y += formY - this.formY;
          this.formX = formX;
          this.formY = formY;
          return [dx, dy];
      }
  }
  class ControlCoord {
      constructor(control, coord) {
          this.control = control;
          this.coord = coord;
      }
      align(other, offset) {
          return new AlignConstraint(this.control, this.coord, other.control, other.coord, offset);
      }
      set(v) {
          if (v === null || v === undefined) {
              return null;
          }
          return new StaticConstraint(this.control, this.coord, v);
      }
      fit(padding, min) {
          return new ContentConstraint(this.control, this.coord.axis, padding, min);
      }
  }
  class ControlCoords {
      constructor(control) {
          this.control = control;
      }
      get x() {
          return new ControlCoord(this.control, Coord.X);
      }
      get y() {
          return new ControlCoord(this.control, Coord.Y);
      }
      get w() {
          return new ControlCoord(this.control, Coord.W);
      }
      get h() {
          return new ControlCoord(this.control, Coord.H);
      }
      get x2() {
          return new ControlCoord(this.control, Coord.X2);
      }
      get y2() {
          return new ControlCoord(this.control, Coord.Y2);
      }
      get xw() {
          return new ControlCoord(this.control, Coord.XW);
      }
      get yh() {
          return new ControlCoord(this.control, Coord.YH);
      }
      get x2w() {
          return new ControlCoord(this.control, Coord.X2W);
      }
      get y2h() {
          return new ControlCoord(this.control, Coord.Y2H);
      }
      size(w, h) {
          this.w.set(w);
          this.h.set(h);
      }
      center(axis, wh) {
          if (wh !== undefined) {
              if (axis === CoordAxis.X) {
                  this.w.set(wh);
              }
              else if (axis === CoordAxis.Y) {
                  this.h.set(wh);
              }
          }
          return new CenterConstraint(this.control, axis);
      }
  }
  class Control {
      constructor() {
          this.controls = [];
          this.childConstraints = [];
          this.refConstraintsX = [];
          this.refConstraintsY = [];
          this.constraintsAppliedX = 0;
          this.constraintsAppliedY = 0;
          this.parent = null;
          this._enableHitDetection = false;
          this._enableHitDetectionForChild = false;
          this.x = null;
          this.y = null;
          this.w = null;
          this.h = null;
          this.x2 = null;
          this.y2 = null;
          this.xw = null;
          this.yh = null;
          this.x2w = null;
          this.y2h = null;
          this.clip = true;
          this.focused = false;
          this.fontSize = null;
          this.fontName = null;
          this.color = null;
          this.border = false;
          this.opacity = 1;
          this.dragTarget = false;
          this.mousedown = new EventSource(() => {
              this.enableHitDetection();
          });
          this.mouseup = new EventSource(() => {
              this.enableHitDetection();
          });
          this.mousemove = new EventSource(() => {
              this.enableHitDetection();
          });
          this.mousedbl = new EventSource(() => {
              this.enableHitDetection();
          });
          this.keydown = new EventSource(() => {
              this.enableHitDetection();
          });
      }
      toString() {
          return `Control at X: ${this.x} Y: ${this.y}`;
      }
      recalculate(axis) {
          function nn(v) {
              return v !== null;
          }
          function unspecified(coords) {
              let n = 0;
              for (const c of coords) {
                  if (c === null) {
                      n += 1;
                  }
              }
              return n;
          }
          let prevUnspecified = 0;
          let nowUnspecified = 0;
          if (axis === CoordAxis.X) {
              prevUnspecified = unspecified([this.x, this.w, this.x2, this.x2w, this.xw]);
              if (nn(this.x) && nn(this.w)) {
                  this.xw = this.x + this.w;
                  if (nn(this.parent.w)) {
                      this.x2 = this.parent.w - this.x - this.w;
                      this.x2w = this.x2 + this.w;
                  }
              }
              else if (nn(this.x) && nn(this.x2)) {
                  if (nn(this.parent.w)) {
                      this.w = this.parent.w - this.x - this.x2;
                      this.xw = this.x + this.w;
                      this.x2w = this.x2 + this.w;
                  }
              }
              else if (nn(this.x) && nn(this.xw)) {
                  this.w = this.xw - this.x;
                  if (nn(this.parent.w)) {
                      this.x2 = this.parent.w - this.xw;
                      this.x2w = this.x2 + this.w;
                  }
              }
              else if (nn(this.x) && nn(this.x2w)) ;
              else if (nn(this.w) && nn(this.x2)) {
                  if (nn(this.parent.w)) {
                      this.x = this.parent.w - this.w - this.x2;
                      this.xw = this.x + this.w;
                  }
                  this.x2w = this.x2 + this.w;
              }
              else if (nn(this.w) && nn(this.xw)) {
                  this.x = this.xw - this.w;
                  if (nn(this.parent.w)) {
                      this.x2 = this.parent.w - this.xw;
                      this.x2w = this.x2 + this.w;
                  }
              }
              else if (nn(this.w) && nn(this.x2w)) {
                  this.x2 = this.x2w - this.w;
                  if (nn(this.parent.w)) {
                      this.x = this.parent.w - this.x2w;
                      this.xw = this.x + this.w;
                  }
              }
              else if (nn(this.x2) && nn(this.xw)) ;
              else if (nn(this.x2) && nn(this.x2w)) {
                  this.w = this.x2w - this.x2;
                  if (nn(this.parent.w)) {
                      this.x = this.parent.w - this.x2w;
                      this.xw = this.x + this.w;
                  }
              }
              else if (nn(this.xw) && nn(this.x2w)) {
                  if (nn(this.parent.w)) {
                      this.w = -(this.parent.w - this.xw - this.x2w);
                      this.x = this.xw - this.w;
                      this.x2 = this.x2w - this.w;
                  }
              }
              nowUnspecified = unspecified([this.x, this.w, this.x2, this.x2w, this.xw]);
          }
          else if (axis === CoordAxis.Y) {
              prevUnspecified = unspecified([this.y, this.h, this.y2, this.y2h, this.yh]);
              if (nn(this.y) && nn(this.h)) {
                  this.yh = this.y + this.h;
                  if (nn(this.parent.h)) {
                      this.y2 = this.parent.h - this.y - this.h;
                      this.y2h = this.y2 + this.h;
                  }
              }
              else if (nn(this.y) && nn(this.y2)) {
                  if (nn(this.parent.h)) {
                      this.h = this.parent.h - this.y - this.y2;
                      this.yh = this.y + this.h;
                      this.y2h = this.y2 + this.h;
                  }
              }
              else if (nn(this.y) && nn(this.yh)) {
                  this.h = this.yh - this.y;
                  if (nn(this.parent.h)) {
                      this.y2 = this.parent.h - this.yh;
                      this.y2h = this.y2 + this.h;
                  }
              }
              else if (nn(this.y) && nn(this.y2h)) ;
              else if (nn(this.h) && nn(this.y2)) {
                  if (nn(this.parent.h)) {
                      this.y = this.parent.h - this.h - this.y2;
                      this.yh = this.y + this.h;
                  }
                  this.y2h = this.y2 + this.h;
              }
              else if (nn(this.h) && nn(this.yh)) {
                  this.y = this.yh - this.h;
                  if (nn(this.parent.h)) {
                      this.y2 = this.parent.h - this.yh;
                      this.y2h = this.y2 + this.h;
                  }
              }
              else if (nn(this.h) && nn(this.y2h)) {
                  this.y2 = this.y2h - this.h;
                  if (nn(this.parent.h)) {
                      this.y = this.parent.h - this.y2h;
                      this.yh = this.y + this.h;
                  }
              }
              else if (nn(this.y2) && nn(this.yh)) ;
              else if (nn(this.y2) && nn(this.y2h)) {
                  this.h = this.y2h - this.y2;
                  if (nn(this.parent.h)) {
                      this.y = this.parent.h - this.y2h;
                      this.yh = this.y + this.h;
                  }
              }
              else if (nn(this.yh) && nn(this.y2h)) {
                  if (nn(this.parent.h)) {
                      this.h = -(this.parent.h - this.yh - this.y2h);
                      this.y = this.yh - this.h;
                      this.y2 = this.y2h - this.h;
                  }
              }
              nowUnspecified = unspecified([this.y, this.h, this.y2, this.y2h, this.yh]);
          }
          if (prevUnspecified !== nowUnspecified) {
              for (const c of this.controls) {
                  c.recalculate(axis);
              }
          }
      }
      enableHitDetection() {
          this._enableHitDetection = true;
          this.enableChildHitDetectionOnParent();
      }
      enableChildHitDetectionOnParent() {
          let p = this.parent;
          while (p) {
              p._enableHitDetectionForChild = true;
              p = p.parent;
          }
      }
      controlAtPoint(x, y, opts) {
          opts = opts || {};
          opts.all = opts.all || this.editing();
          opts.formX = (opts.formX === undefined) ? x : opts.formX;
          opts.formY = (opts.formY === undefined) ? y : opts.formY;
          opts.exclude = opts.exclude || [];
          for (let i = this.controls.length - 1; i >= 0; --i) {
              const c = this.controls[i];
              if (opts.exclude.indexOf(c) >= 0) {
                  continue;
              }
              const cx = x - c.x;
              const cy = y - c.y;
              if ((opts.all || c._enableHitDetection || c._enableHitDetectionForChild) && c.inside(cx, cy)) {
                  const hit = c.controlAtPoint(cx, cy, opts);
                  if (hit) {
                      return hit;
                  }
              }
          }
          if (this._enableHitDetection) {
              return new ControlAtPointData(this, x, y, opts.formX, opts.formY);
          }
      }
      inside(x, y) {
          return x >= 0 && y >= 0 && x < this.w && y < this.h;
      }
      refConstraint(constraint, axis) {
          if (axis === CoordAxis.X) {
              this.refConstraintsX.push(constraint);
          }
          else if (axis === CoordAxis.Y) {
              this.refConstraintsY.push(constraint);
          }
      }
      unrefConstraint(constraint, axis) {
          if (axis === CoordAxis.X) {
              const i = this.refConstraintsX.indexOf(constraint);
              if (i < 0) {
                  throw new Error('Unable to unref constraint.');
              }
              this.refConstraintsX.splice(i, 1);
          }
          else if (axis === CoordAxis.Y) {
              const i = this.refConstraintsY.indexOf(constraint);
              if (i < 0) {
                  throw new Error('Unable to unref constraint.');
              }
              this.refConstraintsY.splice(i, 1);
          }
      }
      applyDefaultLayout(axis) {
          if (axis === CoordAxis.X) {
              if (this.w === null) {
                  this.w = this.form().defaultWidth();
                  this.recalculate(CoordAxis.X);
              }
              if (this.x === null) {
                  this.x = 10;
                  this.recalculate(CoordAxis.X);
              }
          }
          else if (axis === CoordAxis.Y) {
              if (this.h === null) {
                  this.h = this.form().defaultHeight();
                  this.recalculate(CoordAxis.Y);
              }
              if (this.y === null) {
                  this.y = 10;
                  this.recalculate(CoordAxis.Y);
              }
          }
      }
      outstandingConstraints(axis) {
          if (axis === CoordAxis.X) {
              return this.refConstraintsX.length - this.constraintsAppliedX;
          }
          else if (axis === CoordAxis.Y) {
              return this.refConstraintsY.length - this.constraintsAppliedY;
          }
          else {
              return 0;
          }
      }
      constraintApplied(axis) {
          if (axis === CoordAxis.X) {
              this.constraintsAppliedX += 1;
          }
          else if (axis === CoordAxis.Y) {
              this.constraintsAppliedY += 1;
          }
          if (this.outstandingConstraints(axis) === 0) {
              this.applyDefaultLayout(axis);
          }
      }
      resetLayout() {
          this.x = null;
          this.y = null;
          this.w = null;
          this.h = null;
          this.x2 = null;
          this.y2 = null;
          this.xw = null;
          this.yh = null;
          this.x2w = null;
          this.y2h = null;
          this.constraintsAppliedX = 0;
          this.constraintsAppliedY = 0;
          for (const control of this.controls) {
              control.resetLayout();
          }
          if (this.selfConstrain()) {
              this.recalculate(CoordAxis.X);
              this.recalculate(CoordAxis.Y);
          }
          if (this.refConstraintsX.length === 0) {
              this.applyDefaultLayout(CoordAxis.X);
          }
          if (this.refConstraintsY.length === 0) {
              this.applyDefaultLayout(CoordAxis.Y);
          }
      }
      findConstraints(pending) {
          for (const c of this.childConstraints) {
              pending.push(c);
          }
          for (const c of this.controls) {
              c.findConstraints(pending);
          }
      }
      layoutComplete() {
          const b = [this.x, this.y, this.w, this.h, this.x2, this.y2, this.x2w, this.y2h, this.xw, this.yh];
          for (const bb of b) {
              if (bb === null) {
                  throw new Error('Control was not fully specified after layout.');
              }
          }
          for (const control of this.controls) {
              control.layoutComplete();
          }
      }
      layoutAttempt(round) {
          for (const control of this.controls) {
              control.resetLayout();
          }
          let i = 0;
          let constraints = [];
          this.findConstraints(constraints);
          constraints.sort((a, b) => a.order - b.order);
          let pending = constraints;
          while (pending.length > 0) {
              let next = [];
              for (const c of pending) {
                  if (c.apply()) {
                      c.order = i;
                      ++i;
                  }
                  else {
                      next.push(c);
                  }
              }
              if (next.length === pending.length) {
                  throw new Error('Unable to apply remaining constraints.');
              }
              pending = next;
          }
          let done = true;
          for (const c of constraints) {
              if (!c.done(round)) {
                  c.order = i;
                  ++i;
                  done = false;
              }
          }
          if (!done) {
              return false;
          }
          this.layoutComplete();
          return true;
      }
      layout() {
          for (let i = 0;; ++i) {
              if (i === 20) {
                  throw new Error('Unable to solve constraints after ' + i + ' iterations.');
              }
              if (this.layoutAttempt(i)) {
                  if (i >= 2) {
                      console.warn('Warning: Layout took ' + (i + 1) + ' rounds.');
                  }
                  break;
              }
          }
      }
      selfConstrain() {
          return false;
      }
      shouldPaint(child) {
          return true;
      }
      unpaint() {
      }
      paint(ctx) {
          for (const c of this.controls) {
              if (!this.shouldPaint(c)) {
                  c.unpaint();
                  continue;
              }
              ctx.save();
              ctx.translate(c.x, c.y);
              if (c.clip) {
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(c.w, 0);
                  ctx.lineTo(c.w, c.h);
                  ctx.lineTo(0, c.h);
                  ctx.closePath();
                  ctx.clip();
              }
              ctx.globalAlpha *= c.opacity;
              c.paint(ctx);
              ctx.globalAlpha /= c.opacity;
              ctx.restore();
          }
          if (this.editing()) {
              for (const c of this.controls) {
                  if (!this.shouldPaint(c)) {
                      continue;
                  }
                  if (c.focused) {
                      for (const cx of c.refConstraintsX) {
                          ctx.save();
                          cx.paint(ctx);
                          ctx.restore();
                      }
                      for (const cx of c.refConstraintsY) {
                          ctx.save();
                          cx.paint(ctx);
                          ctx.restore();
                      }
                  }
              }
          }
          this.paintDecorations(ctx);
      }
      paintDecorations(ctx) {
          if (this.border) {
              ctx.lineWidth = 1;
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(0, this.h);
              ctx.lineTo(0, 0);
              ctx.lineTo(this.w, 0);
              ctx.strokeStyle = '#202020';
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(this.w, 0);
              ctx.lineTo(this.w, this.h);
              ctx.lineTo(0, this.h);
              ctx.strokeStyle = '#707070';
              ctx.stroke();
          }
      }
      add(control, x, y, w, h, x2, y2, xw, yh, x2w, y2h) {
          if (x && typeof x === 'object') {
              return this.add(control, x['x'], x['y'], x['w'], x['h'], x['x2'], x['y2'], x['xw'], x['yh'], x['x2w'], x['y2w']);
          }
          control.parent = this;
          this.controls.push(control);
          control.coords.x.set(x);
          control.coords.y.set(y);
          control.coords.w.set(w);
          control.coords.h.set(h);
          control.coords.x2.set(x2);
          control.coords.y2.set(y2);
          control.coords.xw.set(xw);
          control.coords.yh.set(yh);
          control.coords.x2w.set(x2w);
          control.coords.y2h.set(y2h);
          if (control._enableHitDetection) {
              control.enableChildHitDetectionOnParent();
          }
          control.added();
          this.relayout();
          return control;
      }
      added() {
          this.defaultConstraints();
      }
      defaultConstraints() {
      }
      remove() {
          this.clear();
          for (const c of this.refConstraintsX.slice()) {
              c.removeControl(this);
          }
          for (const c of this.refConstraintsY.slice()) {
              c.removeControl(this);
          }
          if (this.refConstraintsX.length > 0 || this.refConstraintsY.length > 0) {
              throw new Error('Control still referenced by constraints.');
          }
          if (this.parent) {
              for (let i = 0; i < this.parent.controls.length; ++i) {
                  if (this.parent.controls[i] === this) {
                      this.parent.controls.splice(i, 1);
                      break;
                  }
              }
              this.removed();
          }
      }
      removed() {
      }
      clear() {
          while (this.controls.length > 0) {
              this.controls[0].remove();
          }
          if (this.childConstraints.length > 0) {
              throw new Error('There were still constraints left after removing all controls.');
          }
      }
      getFont() {
          return this.getFontSize() + 'px ' + this.getFontName();
      }
      getFontSize() {
          return this.fontSize || this.parent.getFontSize();
      }
      getFontName() {
          return this.fontName || this.parent.getFontName();
      }
      getColor() {
          return this.color || this.parent.getColor();
      }
      repaint() {
          if (this.parent) {
              this.parent.repaint();
          }
      }
      relayout() {
          if (this.parent) {
              this.parent.relayout();
          }
      }
      context() {
          if (this.parent) {
              return this.parent.context();
          }
      }
      editing() {
          if (this.parent) {
              return this.parent.editing();
          }
          else {
              return false;
          }
      }
      form() {
          if (this.parent) {
              return this.parent.form();
          }
          else {
              return null;
          }
      }
      formX() {
          if (this.parent) {
              return this.x + this.parent.formX();
          }
          else {
              return this.x;
          }
      }
      formY() {
          if (this.parent) {
              return this.y + this.parent.formY();
          }
          else {
              return this.y;
          }
      }
      scrollBy(dx, dy) {
          return false;
      }
      get coords() {
          return new ControlCoords(this);
      }
      submit() {
          if (this.parent) {
              this.parent.submit();
          }
      }
      allowDrop(data) {
          return false;
      }
      drop(data) {
      }
  }
  //# sourceMappingURL=control.js.map

  class TextControl extends Control {
      constructor(text) {
          super();
          this.text = text || '';
      }
      evalText() {
          if (this.text instanceof Function) {
              return this.text();
          }
          else {
              return this.text;
          }
      }
      setText(text) {
          this.text = text;
          this.repaint();
      }
  }
  //# sourceMappingURL=textcontrol.js.map

  class Button extends TextControl {
      constructor(text) {
          super(text);
          this.down = false;
          this.click = new EventSource();
          this.mousedown.add((ev) => {
              this.down = true;
              ev.capture();
              this.repaint();
          });
          this.mouseup.add((ev) => {
              if (!this.down) {
                  return;
              }
              this.down = false;
              if (ev.capture && this.inside(ev.x, ev.y)) {
                  this.click.fire();
              }
              this.repaint();
          });
      }
      paint(ctx) {
          super.paint(ctx);
          if (this.down) {
              ctx.fillStyle = '#ff9800';
          }
          else {
              ctx.fillStyle = '#ffeecc';
          }
          if (this.down) {
              ctx.strokeStyle = 'black';
          }
          else {
              ctx.strokeStyle = '#cc8020';
          }
          ctx.lineWidth = 1;
          ctx.lineJoin = 'round';
          const r = 6;
          let rl = r;
          let rr = r;
          if (this.parent instanceof ButtonGroup) {
              if (this !== this.parent.controls[0]) {
                  rl = 0;
              }
              if (this !== this.parent.controls[this.parent.controls.length - 1]) {
                  rr = 0;
              }
          }
          ctx.beginPath();
          ctx.moveTo(rl, 0);
          ctx.lineTo(this.w - rr, 0);
          ctx.arcTo(this.w, 0, this.w, rr, rr);
          ctx.lineTo(this.w, this.h - rr);
          ctx.arcTo(this.w, this.h, this.w - rr, this.h, rr);
          ctx.lineTo(rl, this.h);
          ctx.arcTo(0, this.h, 0, this.h - rl, rl);
          ctx.lineTo(0, rl);
          ctx.arcTo(0, 0, rl, 0, rl);
          if (this.down) {
              ctx.shadowColor = '#c0c0c0';
              ctx.shadowBlur = 8;
              ctx.shadowOffsetX = 3;
              ctx.shadowOffsetY = 3;
          }
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.stroke();
          ctx.font = this.getFont();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = this.getColor();
          ctx.fillText(this.evalText(), this.w / 2, this.h / 2, this.w);
      }
  }
  class ButtonGroup extends Control {
      constructor() {
          super();
      }
      add(control, x, y, w, h, x2, y2, xw, yh, x2w, y2h) {
          if (!(control instanceof Button)) {
              throw new Error('Only Buttons can be added to ButtonGroups');
          }
          super.add(control);
          control.coords.y.set(0);
          control.coords.y2.set(0);
          if (this.fill) {
              this.fill.remove();
              this.fill = null;
          }
          if (this.end) {
              this.end.remove();
              this.end = null;
          }
          if (this.controls.length === 1) {
              control.coords.x.set(0);
          }
          this.end = control.coords.x2.set(0);
          if (this.controls.length >= 2) {
              control.coords.x.align(this.controls[this.controls.length - 2].coords.xw);
              this.fill = new FillConstraint(this.controls, Coord.W);
          }
          return control;
      }
  }
  //# sourceMappingURL=button.js.map

  class CheckBoxToggleEvent extends ControlEvent {
      constructor(control, checked) {
          super(control);
          this.checked = checked;
      }
  }
  class CheckBox extends TextControl {
      constructor(text, checked) {
          super(text);
          this.checked = false;
          this.down = false;
          this.checked = this.checked || false;
          this.on = new EventSource();
          this.off = new EventSource();
          this.toggle = new EventSource();
          this.mousedown.add((ev) => {
              this.down = true;
              ev.capture();
              this.repaint();
          });
          this.mouseup.add((ev) => {
              if (!this.down) {
                  return;
              }
              if (ev.capture && this.inside(ev.x, ev.y)) {
                  this.setChecked(!this.checked);
              }
              this.down = false;
              this.repaint();
          });
      }
      setChecked(checked) {
          if (this.checked === checked) {
              return;
          }
          if (this.radio) {
              this.radio.clear(this);
          }
          this.checked = checked;
          const ev = new CheckBoxToggleEvent(this, this.checked);
          this.toggle.fire(ev);
          if (this.checked) {
              this.on.fire(ev);
          }
          else {
              this.off.fire(ev);
          }
      }
      paint(ctx) {
          super.paint(ctx);
          ctx.fillStyle = 'white';
          if (this.down) {
              ctx.strokeStyle = 'orange';
          }
          else {
              ctx.strokeStyle = 'black';
          }
          ctx.lineJoin = 'round';
          if (this.radio) {
              ctx.beginPath();
              ctx.lineWidth = 1.2;
              ctx.arc(this.h / 2, this.h / 2, this.h / 2, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
          }
          else {
              ctx.fillRect(0, 0, this.h, this.h);
              ctx.lineWidth = 1;
              ctx.strokeRect(0, 0, this.h, this.h);
          }
          if (this.checked) {
              ctx.fillStyle = 'orange';
              if (this.radio) {
                  ctx.beginPath();
                  ctx.arc(this.h / 2, this.h / 2, this.h / 2 - 3, 0, 2 * Math.PI);
                  ctx.fill();
              }
              else {
                  ctx.fillRect(3, 3, this.h - 6, this.h - 6);
              }
          }
          ctx.font = this.getFont();
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = this.getColor();
          ctx.fillText(this.evalText(), this.h + 7, this.h / 2, this.w - this.h - 4);
      }
  }
  class RadioGroup {
      constructor(checkboxes) {
          this.checkboxes = [];
          if (checkboxes) {
              for (const checkbox of checkboxes) {
                  this.add(checkbox);
              }
          }
      }
      add(checkbox) {
          checkbox.radio = this;
          this.checkboxes.push(checkbox);
      }
      clear(selected) {
          for (const checkbox of this.checkboxes) {
              if (checkbox === selected) {
                  continue;
              }
              checkbox.setChecked(false);
          }
      }
  }
  //# sourceMappingURL=checkbox.js.map

  class Modal extends Control {
      constructor(dialog) {
          super();
          this.dialog = dialog;
          this.add(dialog);
          this.mousedown.add((ev) => {
              ev.cancelBubble();
          });
      }
      paint(ctx) {
          const a = ctx.globalAlpha;
          ctx.globalAlpha *= 0.5;
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, this.w, this.h);
          ctx.globalAlpha = a;
          super.paint(ctx);
      }
      selfConstrain() {
          this.x = 0;
          this.y = 0;
          this.x2 = 0;
          this.y2 = 0;
          return true;
      }
      static show(dialog, f) {
          const modal = new Modal(dialog);
          f.add(modal);
          f.pushLayer(modal);
          return new Promise(async (resolve) => {
              modal.opacity = 0;
              await new OpacityAnimator(modal, 0, 1, 200).start();
              modal._resolve = resolve;
          });
      }
      async close(data) {
          await new OpacityAnimator(this, 1, 0, 200).start();
          this.form().popLayer(this);
          this.remove();
          if (this._resolve) {
              this._resolve(data);
              this._resolve = null;
          }
      }
  }
  //# sourceMappingURL=modal.js.map

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var ContentRect_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var ContentRect = function (target) {
      if ('getBBox' in target) {
          var box = target.getBBox();
          return Object.freeze({
              height: box.height,
              left: 0,
              top: 0,
              width: box.width,
          });
      }
      else { // if (target instanceof HTMLElement) { // also includes all other non-SVGGraphicsElements
          var styles = window.getComputedStyle(target);
          return Object.freeze({
              height: parseFloat(styles.height || '0'),
              left: parseFloat(styles.paddingLeft || '0'),
              top: parseFloat(styles.paddingTop || '0'),
              width: parseFloat(styles.width || '0'),
          });
      }
  };
  exports.ContentRect = ContentRect;
  //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGVudFJlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvQ29udGVudFJlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFPQSxJQUFNLFdBQVcsR0FBRyxVQUFDLE1BQWU7SUFDaEMsSUFBSSxTQUFTLElBQUssTUFBNkIsRUFBRTtRQUM3QyxJQUFNLEdBQUcsR0FBSSxNQUE2QixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNqQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07WUFDbEIsSUFBSSxFQUFFLENBQUM7WUFDUCxHQUFHLEVBQUUsQ0FBQztZQUNOLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztTQUNuQixDQUFDLENBQUM7S0FDTjtTQUFNLEVBQUUsMEZBQTBGO1FBQy9GLElBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDakIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQztZQUN4QyxJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDO1lBQzNDLEdBQUcsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUM7WUFDekMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQztTQUN6QyxDQUFDLENBQUM7S0FDTjtBQUNMLENBQUMsQ0FBQztBQUVPLGtDQUFXIn0=
  });

  unwrapExports(ContentRect_1);
  var ContentRect_2 = ContentRect_1.ContentRect;

  var ResizeObservation_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  var ResizeObservation = /** @class */ (function () {
      function ResizeObservation(target) {
          this.target = target;
          this.$$broadcastWidth = this.$$broadcastHeight = 0;
      }
      Object.defineProperty(ResizeObservation.prototype, "broadcastWidth", {
          get: function () {
              return this.$$broadcastWidth;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ResizeObservation.prototype, "broadcastHeight", {
          get: function () {
              return this.$$broadcastHeight;
          },
          enumerable: true,
          configurable: true
      });
      ResizeObservation.prototype.isActive = function () {
          var cr = ContentRect_1.ContentRect(this.target);
          return !!cr
              && (cr.width !== this.broadcastWidth
                  || cr.height !== this.broadcastHeight);
      };
      return ResizeObservation;
  }());
  exports.ResizeObservation = ResizeObservation;
  //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzaXplT2JzZXJ2YXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUmVzaXplT2JzZXJ2YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2Q0FBNEM7QUFFNUM7SUFlSSwyQkFBWSxNQUFlO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFWRCxzQkFBVyw2Q0FBYzthQUF6QjtZQUNJLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQ2pDLENBQUM7OztPQUFBO0lBQ0Qsc0JBQVcsOENBQWU7YUFBMUI7WUFDSSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUNsQyxDQUFDOzs7T0FBQTtJQU9NLG9DQUFRLEdBQWY7UUFDSSxJQUFNLEVBQUUsR0FBRyx5QkFBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVwQyxPQUFPLENBQUMsQ0FBQyxFQUFFO2VBQ0osQ0FDQyxFQUFFLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxjQUFjO21CQUM3QixFQUFFLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxlQUFlLENBQ3hDLENBQUM7SUFDVixDQUFDO0lBQ0wsd0JBQUM7QUFBRCxDQUFDLEFBN0JELElBNkJDO0FBRVEsOENBQWlCIn0=
  });

  unwrapExports(ResizeObservation_1);
  var ResizeObservation_2 = ResizeObservation_1.ResizeObservation;

  var ResizeObserverEntry_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  var ResizeObserverEntry = /** @class */ (function () {
      function ResizeObserverEntry(target) {
          this.target = target;
          this.contentRect = ContentRect_1.ContentRect(target);
      }
      return ResizeObserverEntry;
  }());
  exports.ResizeObserverEntry = ResizeObserverEntry;
  //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzaXplT2JzZXJ2ZXJFbnRyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9SZXNpemVPYnNlcnZlckVudHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQTRDO0FBRTVDO0lBR0ksNkJBQVksTUFBZTtRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLHlCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUNMLDBCQUFDO0FBQUQsQ0FBQyxBQVBELElBT0M7QUFFUSxrREFBbUIifQ==
  });

  unwrapExports(ResizeObserverEntry_1);
  var ResizeObserverEntry_2 = ResizeObserverEntry_1.ResizeObserverEntry;

  var ResizeObserver_1 = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });


  var resizeObservers = [];
  var ResizeObserver = /** @class */ (function () {
      function ResizeObserver(callback) {
          /** @internal */
          this.$$observationTargets = [];
          /** @internal */
          this.$$activeTargets = [];
          /** @internal */
          this.$$skippedTargets = [];
          var message = callbackGuard(callback);
          if (message) {
              throw TypeError(message);
          }
          this.$$callback = callback;
          resizeObservers.push(this);
      }
      ResizeObserver.prototype.observe = function (target) {
          var message = targetGuard('observe', target);
          if (message) {
              throw TypeError(message);
          }
          var index = findTargetIndex(this.$$observationTargets, target);
          if (index > 0) {
              return;
          }
          this.$$observationTargets.push(new ResizeObservation_1.ResizeObservation(target));
          startLoop();
      };
      ResizeObserver.prototype.unobserve = function (target) {
          var message = targetGuard('unobserve', target);
          if (message) {
              throw TypeError(message);
          }
          var index = findTargetIndex(this.$$observationTargets, target);
          if (index < 0) {
              return;
          }
          this.$$observationTargets.splice(index, 1);
          checkStopLoop();
      };
      ResizeObserver.prototype.disconnect = function () {
          this.$$observationTargets = [];
          this.$$activeTargets = [];
      };
      return ResizeObserver;
  }());
  exports.ResizeObserver = ResizeObserver;
  function callbackGuard(callback) {
      if (typeof (callback) === 'undefined') {
          return "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.";
      }
      if (typeof (callback) !== 'function') {
          return "Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.";
      }
  }
  function targetGuard(functionName, target) {
      if (typeof (target) === 'undefined') {
          return "Failed to execute '" + functionName + "' on 'ResizeObserver': 1 argument required, but only 0 present.";
      }
      if (!(target instanceof window.Element)) {
          return "Failed to execute '" + functionName + "' on 'ResizeObserver': parameter 1 is not of type 'Element'.";
      }
  }
  function findTargetIndex(collection, target) {
      for (var index = 0; index < collection.length; index += 1) {
          if (collection[index].target === target) {
              return index;
          }
      }
      return -1;
  }
  var gatherActiveObservationsAtDepth = function (depth) {
      resizeObservers.forEach(function (ro) {
          ro.$$activeTargets = [];
          ro.$$skippedTargets = [];
          ro.$$observationTargets.forEach(function (ot) {
              if (ot.isActive()) {
                  var targetDepth = calculateDepthForNode(ot.target);
                  if (targetDepth > depth) {
                      ro.$$activeTargets.push(ot);
                  }
                  else {
                      ro.$$skippedTargets.push(ot);
                  }
              }
          });
      });
  };
  var hasActiveObservations = function () {
      return resizeObservers.some(function (ro) { return !!ro.$$activeTargets.length; });
  };
  var hasSkippedObservations = function () {
      return resizeObservers.some(function (ro) { return !!ro.$$skippedTargets.length; });
  };
  var broadcastActiveObservations = function () {
      var shallowestTargetDepth = Infinity;
      resizeObservers.forEach(function (ro) {
          if (!ro.$$activeTargets.length) {
              return;
          }
          var entries = [];
          ro.$$activeTargets.forEach(function (obs) {
              var entry = new ResizeObserverEntry_1.ResizeObserverEntry(obs.target);
              entries.push(entry);
              obs.$$broadcastWidth = entry.contentRect.width;
              obs.$$broadcastHeight = entry.contentRect.height;
              var targetDepth = calculateDepthForNode(obs.target);
              if (targetDepth < shallowestTargetDepth) {
                  shallowestTargetDepth = targetDepth;
              }
          });
          ro.$$callback(entries, ro);
          ro.$$activeTargets = [];
      });
      return shallowestTargetDepth;
  };
  var deliverResizeLoopErrorNotification = function () {
      var errorEvent = new window.ErrorEvent('ResizeLoopError', {
          message: 'ResizeObserver loop completed with undelivered notifications.',
      });
      window.dispatchEvent(errorEvent);
  };
  var calculateDepthForNode = function (target) {
      var depth = 0;
      while (target.parentNode) {
          target = target.parentNode;
          depth += 1;
      }
      return depth;
  };
  var notificationIteration = function () {
      var depth = 0;
      gatherActiveObservationsAtDepth(depth);
      while (hasActiveObservations()) {
          depth = broadcastActiveObservations();
          gatherActiveObservationsAtDepth(depth);
      }
      if (hasSkippedObservations()) {
          deliverResizeLoopErrorNotification();
      }
  };
  var animationFrameCancelToken;
  var startLoop = function () {
      if (animationFrameCancelToken)
          return;
      runLoop();
  };
  var runLoop = function () {
      animationFrameCancelToken = window.requestAnimationFrame(function () {
          notificationIteration();
          runLoop();
      });
  };
  var checkStopLoop = function () {
      if (animationFrameCancelToken && !resizeObservers.some(function (ro) { return !!ro.$$observationTargets.length; })) {
          window.cancelAnimationFrame(animationFrameCancelToken);
          animationFrameCancelToken = undefined;
      }
  };
  var install = function () {
      return window.ResizeObserver = ResizeObserver;
  };
  exports.install = install;
  //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzaXplT2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUmVzaXplT2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5REFBd0Q7QUFFeEQsNkRBQTREO0FBRTVELElBQU0sZUFBZSxHQUFHLEVBQXNCLENBQUM7QUFFL0M7SUFVSSx3QkFBWSxRQUFnQztRQVA1QyxnQkFBZ0I7UUFDVCx5QkFBb0IsR0FBRyxFQUF5QixDQUFDO1FBQ3hELGdCQUFnQjtRQUNULG9CQUFlLEdBQUcsRUFBeUIsQ0FBQztRQUNuRCxnQkFBZ0I7UUFDVCxxQkFBZ0IsR0FBRyxFQUF5QixDQUFDO1FBR2hELElBQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxJQUFJLE9BQU8sRUFBRTtZQUNULE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDM0IsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU0sZ0NBQU8sR0FBZCxVQUFlLE1BQWU7UUFDMUIsSUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQyxJQUFJLE9BQU8sRUFBRTtZQUNULE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsSUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqRSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDWCxPQUFPO1NBQ1Y7UUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUkscUNBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM5RCxTQUFTLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRU0sa0NBQVMsR0FBaEIsVUFBaUIsTUFBZTtRQUM1QixJQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELElBQUksT0FBTyxFQUFFO1lBQ1QsTUFBTSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDNUI7UUFDRCxJQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pFLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtZQUNYLE9BQU87U0FDVjtRQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNDLGFBQWEsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFTSxtQ0FBVSxHQUFqQjtRQUNJLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0FBQyxBQWpERCxJQWlEQztBQXVJRyx3Q0FBYztBQXJJbEIsU0FBUyxhQUFhLENBQUMsUUFBZ0M7SUFDbkQsSUFBSSxPQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssV0FBVyxFQUFFO1FBQ2xDLE9BQU8sZ0ZBQWdGLENBQUM7S0FDM0Y7SUFDRCxJQUFJLE9BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxVQUFVLEVBQUU7UUFDakMsT0FBTywrRkFBK0YsQ0FBQztLQUMxRztBQUNMLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxZQUFvQixFQUFFLE1BQWU7SUFDdEQsSUFBSSxPQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssV0FBVyxFQUFFO1FBQ2hDLE9BQU8sd0JBQXNCLFlBQVksb0VBQWlFLENBQUM7S0FDOUc7SUFDRCxJQUFJLENBQUMsQ0FBQyxNQUFNLFlBQWEsTUFBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzlDLE9BQU8sd0JBQXNCLFlBQVksaUVBQThELENBQUM7S0FDM0c7QUFDTCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsVUFBK0IsRUFBRSxNQUFlO0lBQ3JFLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLEVBQUU7UUFDdkQsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUNyQyxPQUFPLEtBQUssQ0FBQztTQUNoQjtLQUNKO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUM7QUFFRCxJQUFNLCtCQUErQixHQUFHLFVBQUMsS0FBYTtJQUNsRCxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQUMsRUFBRTtRQUN2QixFQUFFLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztRQUN4QixFQUFFLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFFO1lBQy9CLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUNmLElBQU0sV0FBVyxHQUFHLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckQsSUFBSSxXQUFXLEdBQUcsS0FBSyxFQUFFO29CQUNyQixFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDL0I7cUJBQU07b0JBQ0gsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDaEM7YUFDSjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFFRixJQUFNLHFCQUFxQixHQUFHO0lBQzFCLE9BQUEsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFDLEVBQUUsSUFBSyxPQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBM0IsQ0FBMkIsQ0FBQztBQUF6RCxDQUF5RCxDQUFDO0FBRTlELElBQU0sc0JBQXNCLEdBQUc7SUFDM0IsT0FBQSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQUMsRUFBRSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQTVCLENBQTRCLENBQUM7QUFBMUQsQ0FBMEQsQ0FBQztBQUUvRCxJQUFNLDJCQUEyQixHQUFHO0lBQ2hDLElBQUkscUJBQXFCLEdBQUcsUUFBUSxDQUFDO0lBQ3JDLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFFO1FBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRTtZQUM1QixPQUFPO1NBQ1Y7UUFFRCxJQUFNLE9BQU8sR0FBRyxFQUEyQixDQUFDO1FBQzVDLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQUMsR0FBRztZQUMzQixJQUFNLEtBQUssR0FBRyxJQUFJLHlDQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BCLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUMvQyxHQUFHLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDakQsSUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RELElBQUksV0FBVyxHQUFHLHFCQUFxQixFQUFFO2dCQUNyQyxxQkFBcUIsR0FBRyxXQUFXLENBQUM7YUFDdkM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLEVBQUUsQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUNqQyxDQUFDLENBQUM7QUFFRixJQUFNLGtDQUFrQyxHQUFHO0lBQ3ZDLElBQU0sVUFBVSxHQUFHLElBQUssTUFBYyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRTtRQUNqRSxPQUFPLEVBQUUsK0RBQStEO0tBQzNFLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDO0FBRUYsSUFBTSxxQkFBcUIsR0FBRyxVQUFDLE1BQVk7SUFDdkMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ3RCLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzNCLEtBQUssSUFBSSxDQUFDLENBQUM7S0FDZDtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMsQ0FBQztBQUVGLElBQU0scUJBQXFCLEdBQUc7SUFDMUIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsT0FBTyxxQkFBcUIsRUFBRSxFQUFFO1FBQzVCLEtBQUssR0FBRywyQkFBMkIsRUFBRSxDQUFDO1FBQ3RDLCtCQUErQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzFDO0lBRUQsSUFBSSxzQkFBc0IsRUFBRSxFQUFFO1FBQzFCLGtDQUFrQyxFQUFFLENBQUM7S0FDeEM7QUFDTCxDQUFDLENBQUM7QUFFRixJQUFJLHlCQUE2QyxDQUFDO0FBRWxELElBQU0sU0FBUyxHQUFHO0lBQ2QsSUFBSSx5QkFBeUI7UUFBRSxPQUFPO0lBRXRDLE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQyxDQUFDO0FBRUYsSUFBTSxPQUFPLEdBQUc7SUFDWix5QkFBeUIsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUM7UUFDckQscUJBQXFCLEVBQUUsQ0FBQztRQUN4QixPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDO0FBRUYsSUFBTSxhQUFhLEdBQUc7SUFDbEIsSUFBSSx5QkFBeUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBQyxFQUFFLElBQUssT0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBaEMsQ0FBZ0MsQ0FBQyxFQUFFO1FBQzlGLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3ZELHlCQUF5QixHQUFHLFNBQVMsQ0FBQztLQUN6QztBQUNMLENBQUMsQ0FBQztBQUVGLElBQU0sT0FBTyxHQUFHO0lBQ1osT0FBQyxNQUFjLENBQUMsY0FBYyxHQUFHLGNBQWM7QUFBL0MsQ0FBK0MsQ0FBQztBQUdoRCwwQkFBTyJ9
  });

  unwrapExports(ResizeObserver_1);
  var ResizeObserver_2 = ResizeObserver_1.ResizeObserver;
  var ResizeObserver_3 = ResizeObserver_1.install;

  class SurfaceResizeEvent {
      constructor(w, h) {
          this.w = w;
          this.h = h;
      }
  }
  class SurfaceScrollEvent {
      constructor(dx, dy) {
          this.dx = dx;
          this.dy = dy;
      }
  }
  class SurfaceMouseEvent {
      constructor(x, y, buttons) {
          this.x = x;
          this.y = y;
          this.buttons = buttons;
      }
      primaryButton() {
          return this.buttons & 1;
      }
  }
  class SurfaceKeyEvent {
      constructor(key) {
          this.key = key;
      }
  }
  class Surface {
      constructor(selector) {
          this.elem = document.querySelector(selector);
          this.fitParent();
          this.ctx = this.elem.getContext('2d');
          this.resize = new EventSource();
          this.scroll = new EventSource();
          this.mousedown = new EventSource();
          this.mouseup = new EventSource();
          this.mousemove = new EventSource();
          this.mousewheel = new EventSource();
          this.mousedbl = new EventSource();
          this.keydown = new EventSource();
          this.container.tabIndex = 1;
          const createTouchEvent = (ev) => {
              const rect = ev.currentTarget.getBoundingClientRect();
              const offsetX = ev.changedTouches[0].clientX - rect.left;
              const offsetY = ev.changedTouches[0].clientY - rect.top;
              return new SurfaceMouseEvent(this.pixels(offsetX), this.pixels(offsetY), ev.touches.length);
          };
          const createMouseEvent = (ev) => {
              const rect = ev.currentTarget.getBoundingClientRect();
              const offsetX = ev.clientX - rect.left;
              const offsetY = ev.clientY - rect.top;
              return new SurfaceMouseEvent(this.pixels(offsetX), this.pixels(offsetY), ev.buttons);
          };
          if (navigator.maxTouchPoints || document.documentElement['ontouchstart']) {
              this.container.addEventListener('touchstart', (ev) => {
                  this.mousedown.fire(createTouchEvent(ev));
                  if (ev.target === this.container) {
                      ev.preventDefault();
                  }
              });
              this.container.addEventListener('touchend', (ev) => {
                  this.mouseup.fire(createTouchEvent(ev));
              });
              this.container.addEventListener('touchmove', (ev) => {
                  this.mousemove.fire(createTouchEvent(ev));
              });
              this.container.addEventListener('mousedown', (ev) => {
                  this.mousedown.fire(createMouseEvent(ev));
              });
              this.container.addEventListener('mouseup', (ev) => {
                  this.mouseup.fire(createMouseEvent(ev));
              });
              this.container.addEventListener('mousemove', (ev) => {
                  this.mousemove.fire(createMouseEvent(ev));
              });
              this.container.addEventListener('dblclick', (ev) => {
                  this.mousedbl.fire(createMouseEvent(ev));
              });
          }
          else {
              this.container.addEventListener('mousedown', (ev) => {
                  this.mousedown.fire(createMouseEvent(ev));
              });
              this.container.addEventListener('mouseup', (ev) => {
                  this.mouseup.fire(createMouseEvent(ev));
              });
              this.container.addEventListener('mousemove', (ev) => {
                  this.mousemove.fire(createMouseEvent(ev));
              });
              this.container.addEventListener('dblclick', (ev) => {
                  this.mousedbl.fire(createMouseEvent(ev));
              });
          }
          this.container.addEventListener('keydown', (ev) => {
              this.keydown.fire(new SurfaceKeyEvent(ev.keyCode));
          });
          this.container.addEventListener('wheel', (ev) => {
              let dx = ev.deltaX;
              let dy = ev.deltaY;
              if (ev.deltaMode === 0) ;
              else if (ev.deltaMode === 1) {
                  dx *= 20;
                  dy *= 20;
              }
              else if (ev.deltaMode === 2) ;
              this.mousewheel.fire(new SurfaceMouseEvent(this.pixels(ev.offsetX), this.pixels(ev.offsetY), ev.buttons));
              this.scroll.fire(new SurfaceScrollEvent(-dx, -dy));
          });
      }
      fitParent() {
          const parent = this.elem.parentElement;
          if (parent !== document.body && parent.style.position !== 'absolute') {
              parent.style.position = 'relative';
          }
          parent.style.overflow = 'hidden';
          parent.style.touchAction = 'none';
          if (parent === document.body) {
              parent.style.height = '100%';
              parent.parentElement.style.height = '100%';
          }
          this.container = document.createElement('div');
          this.elem.remove();
          this.container.appendChild(this.elem);
          parent.appendChild(this.container);
          this.container.style.position = 'absolute';
          this.container.style.boxSizing = 'border-box';
          this.container.style.left = '0px';
          this.container.style.top = '0px';
          this.container.style.overflow = 'hidden';
          this.elem.style.position = 'absolute';
          this.elem.style.boxSizing = 'border-box';
          this.elem.style.left = 0 + 'px';
          this.elem.style.top = 0 + 'px';
          this.elem.style.pointerEvents = 'none';
          new ResizeObserver_2((entries) => {
              let w = 0, h = 0;
              if (parent === document.body) {
                  w = window.innerWidth;
                  h = window.innerHeight;
              }
              else {
                  w = parent.clientWidth;
                  h = parent.clientHeight;
              }
              this.container.style.width = w + 'px';
              this.container.style.height = h + 'px';
              this.elem.style.width = w + 'px';
              this.elem.style.height = h + 'px';
              w = this.elem.clientWidth;
              h = this.elem.clientHeight;
              const s = window.devicePixelRatio;
              this.elem.width = Math.round(w * s);
              this.elem.height = Math.round(h * s);
              (this.ctx).resetTransform();
              let zoom = Math.floor(s);
              this.ctx.scale(zoom, zoom);
              this.ctx.translate(0.5, 0.5);
              this.resize.fire(new SurfaceResizeEvent(Math.round(w * s / zoom), Math.round(h * s / zoom)));
          }).observe(parent);
      }
      pixels(v) {
          return Math.round(v * window.devicePixelRatio / Math.floor(window.devicePixelRatio));
      }
      htmlunits(v) {
          return v / window.devicePixelRatio * Math.floor(window.devicePixelRatio);
      }
  }
  //# sourceMappingURL=surface.js.map

  class FormMouseDownEvent extends SurfaceMouseEvent {
      constructor(x, y, buttons, form, hit, control) {
          super(x, y, buttons);
          this.form = form;
          this.hit = hit;
          this.control = control;
      }
      capture() {
          this.form.setCapture(this.hit, false);
      }
      captureDrag() {
          this.form.setCapture(this.hit, true);
      }
      allowDrag(data) {
          this.form.setAllowDrag(this.hit, data);
      }
      cancelBubble() {
          this.form.cancelBubble();
      }
  }
  class FormMouseMoveEvent extends SurfaceMouseEvent {
      constructor(x, y, buttons, form, dragX, dragY, dx, dy, capture) {
          super(x, y, buttons);
          this.form = form;
          this.dragX = dragX;
          this.dragY = dragY;
          this.dx = dx;
          this.dy = dy;
          this.capture = capture;
      }
      cancelDragCapture() {
          this.form.restoreCapture();
      }
  }
  class FormMouseUpEvent extends SurfaceMouseEvent {
      constructor(x, y, buttons, capture) {
          super(x, y, buttons);
          this.capture = capture;
      }
  }
  class FormKeyEvent extends SurfaceKeyEvent {
      constructor(key) {
          super(key);
      }
  }
  class Form extends Control {
      constructor(surface) {
          super();
          this.surface = surface;
          this._pendingLayout = false;
          this._pendingPaint = false;
          this.fontSize = 18;
          this.fontName = 'sans';
          this.color = '#202020';
          this._editing = false;
          this._bubbleMouseDown = true;
          this._layers = [];
          this._animators = [];
          this.surface.resize.add(data => {
              this.x = 0;
              this.y = 0;
              this.w = data.w;
              this.h = data.h;
              this.x2 = 0;
              this.y2 = 0;
              this.x2w = this.w;
              this.y2h = this.h;
              this.xw = this.w;
              this.yh = this.h;
              this.relayout();
          });
          this.surface.scroll.add(data => {
              if (this._focus) {
                  let c = this._focus.control;
                  while (c) {
                      if (c.scrollBy(data.dx, data.dy)) {
                          break;
                      }
                      c = c.parent;
                  }
              }
          });
          this.surface.mousemove.add(data => {
              if (this._capture && !data.primaryButton()) {
                  this._capture.update(data.x, data.y);
                  this._capture.control.mouseup.fire(new FormMouseUpEvent(this._capture.x, this._capture.y, data.buttons, true));
                  this.endCapture();
              }
              const restoreCapture = this._capture;
              if (this._dragCapture && data.primaryButton()) {
                  if (!this._capture || (data.x !== this._capture.formX || data.y !== this._capture.formY)) {
                      const newCapture = this._dragCapture;
                      this.endCapture();
                      this._restoreCapture = restoreCapture;
                      this._capture = newCapture;
                  }
              }
              if (this._capture && this._dragAllowed) {
                  this._dragCoordinates = data;
                  if (this._dragTargetControl) {
                      this._dragTargetControl.dragTarget = false;
                  }
                  const dragHit = this.controlAtPoint(data.x, data.y, { all: true });
                  if (dragHit) {
                      const dragTarget = dragHit.control;
                      if (dragTarget !== this._capture.control && dragTarget.allowDrop(this._dragData)) {
                          dragTarget.dragTarget = true;
                          this._dragTargetControl = dragTarget;
                      }
                  }
              }
              let delta = [0, 0];
              let target = this._capture;
              if (target) {
                  delta = target.update(data.x, data.y);
              }
              else {
                  target = this.controlAtPoint(data.x, data.y);
                  if (!target) {
                      return;
                  }
                  this.updateFocus(target);
              }
              target.control.mousemove.fire(new FormMouseMoveEvent(target.x, target.y, data.buttons, this, data.x - target.startX, data.y - target.startY, delta[0], delta[1], target === this._capture));
              if (restoreCapture && this._capture !== restoreCapture) {
                  restoreCapture.update(data.x, data.y);
                  restoreCapture.control.mouseup.fire(new FormMouseUpEvent(restoreCapture.x, restoreCapture.y, data.buttons, false));
              }
              this._restoreCapture = null;
              if (!this._capture && this.editing()) {
                  this.repaint();
              }
              if (this._capture && this._dragCoordinates) {
                  this.repaint();
              }
          });
          this.surface.mousedown.add(data => {
              if (!data.primaryButton()) {
                  return;
              }
              if (this._capture) {
                  return;
              }
              this._bubbleMouseDown = true;
              let control = null;
              const exclude = [];
              while (this._bubbleMouseDown) {
                  const hit = this.controlAtPoint(data.x, data.y, { exclude: exclude });
                  if (!hit) {
                      break;
                  }
                  if (!control) {
                      control = hit.control;
                  }
                  hit.control.mousedown.fire(new FormMouseDownEvent(hit.x, hit.y, data.buttons, this, hit, control));
                  exclude.push(hit.control);
              }
          });
          this.surface.mouseup.add(data => {
              if (data.primaryButton()) {
                  return;
              }
              const wasCapture = this._capture !== null;
              let target = this._capture;
              if (target) {
                  target.update(data.x, data.y);
                  if (this._dragCoordinates) {
                      const dropHit = this.controlAtPoint(data.x, data.y);
                      if (dropHit) {
                          const dropTarget = dropHit.control;
                          if (dropTarget.allowDrop(this._dragData)) {
                              dropTarget.drop(this._dragData);
                          }
                      }
                  }
                  this.repaint();
              }
              else {
                  target = this.controlAtPoint(data.x, data.y);
              }
              this.endCapture();
              if (target) {
                  target.control.mouseup.fire(new FormMouseUpEvent(target.x, target.y, data.buttons, wasCapture));
              }
          });
          this.surface.mousewheel.add(data => {
              const hit = this.controlAtPoint(data.x, data.y);
              if (hit) {
                  this.updateFocus(hit);
              }
          });
          this.surface.mousedbl.add(ev => {
              const hit = this.controlAtPoint(ev.x, ev.y);
              if (hit) {
                  hit.control.mousedbl.fire(new FormMouseUpEvent(hit.x, hit.y, ev.buttons, false));
              }
          });
          this.surface.keydown.add(data => {
              if (this._focus) {
                  let control = this._focus.control;
                  while (control) {
                      control.keydown.fire(new FormKeyEvent(data.key));
                      control = control.parent;
                  }
              }
          });
      }
      endCapture() {
          this._capture = null;
          this._dragCapture = null;
          this._dragAllowed = false;
          this._dragData = null;
          if (this._dragTargetControl) {
              this._dragTargetControl.dragTarget = false;
          }
          this._dragTargetControl = null;
          this._dragCoordinates = null;
      }
      updateFocus(hit) {
          if (this._focus) {
              this._focus.control.focused = false;
          }
          this._focus = hit;
          this._focus.control.focused = true;
      }
      paint(ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, this.w, this.h);
          super.paint(ctx);
          if (this._capture && this._dragCoordinates) {
              ctx.save();
              ctx.translate(this._dragCoordinates.x + 10, this._dragCoordinates.y + 10);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(this._capture.control.w, 0);
              ctx.lineTo(this._capture.control.w, this._capture.control.h);
              ctx.lineTo(0, this._capture.control.h);
              ctx.closePath();
              ctx.clip();
              ctx.globalAlpha *= 0.5;
              this._capture.control.paint(ctx);
              ctx.globalAlpha /= 0.5;
              ctx.restore();
          }
      }
      animationFrame(frameTimeMs) {
          if (this._pendingLayout) {
              this._pendingLayout = false;
              this.layout();
              this._pendingPaint = true;
          }
          if (this._pendingPaint) {
              this._pendingPaint = false;
              for (const a of this._animators) {
                  a.apply(frameTimeMs);
              }
              this.paint(this.context());
          }
      }
      repaint() {
          if (this._pendingPaint) {
              return;
          }
          this._pendingPaint = true;
          if (this._pendingLayout) {
              return;
          }
          window.requestAnimationFrame(this.animationFrame.bind(this));
      }
      relayout() {
          if (this._pendingLayout) {
              return;
          }
          this._pendingLayout = true;
          if (this._pendingPaint) {
              return;
          }
          this._pendingPaint = true;
          window.requestAnimationFrame(this.animationFrame.bind(this));
      }
      context() {
          return this.surface.ctx;
      }
      editing(enable) {
          if (enable !== undefined) {
              this._editing = enable;
          }
          return this._editing;
      }
      form() {
          return this;
      }
      defaultWidth() {
          return 160;
      }
      defaultHeight() {
          return 32;
      }
      formX() {
          return 0;
      }
      formY() {
          return 0;
      }
      allowDom(control) {
          if (this._layers.length === 0) {
              return true;
          }
          if (control.parent === this) {
              return control === this._layers[this._layers.length - 1];
          }
          else {
              return this.allowDom(control.parent);
          }
      }
      pushLayer(control) {
          if (control.parent !== this) {
              return this.pushLayer(control.parent);
          }
          this._layers.push(control);
      }
      popLayer(control) {
          if (control.parent !== this) {
              return this.popLayer(control.parent);
          }
          if (this._layers[this._layers.length - 1] !== control) {
              throw new Error('Wrong layer popped from stack.');
          }
          this._layers.pop();
      }
      addAnimator(animator) {
          this._animators.push(animator);
          this.repaint();
      }
      removeAnimator(animator) {
          for (let i = 0; i < this._animators.length; ++i) {
              if (this._animators[i] === animator) {
                  this._animators.splice(i, 1);
                  return;
              }
          }
      }
      setCapture(control, drag) {
          if (this._capture) ;
          if (drag) {
              this._dragCapture = control;
          }
          else {
              this._capture = control;
          }
      }
      restoreCapture() {
          if (this._restoreCapture) {
              this._capture = this._restoreCapture;
          }
      }
      setAllowDrag(control, data) {
          this.setCapture(control, false);
          this._dragAllowed = true;
          this._dragData = data;
          this.cancelBubble();
      }
      cancelBubble() {
          this._bubbleMouseDown = false;
      }
  }
  //# sourceMappingURL=form.js.map

  //# sourceMappingURL=index.js.map

  class TextBoxChangeEvent extends ControlEvent {
      constructor(control, text) {
          super(control);
          this.text = text;
      }
  }
  class _TextBox extends Control {
      constructor(text) {
          super();
          this.multiline = false;
          this.elem = null;
          this.text = text || '';
          this.change = new EventSource();
      }
      unpaint() {
          if (this.elem) {
              const e = this.elem;
              this.elem = null;
              e.remove();
          }
      }
      paint(ctx) {
          super.paint(ctx);
          if (this.elem && !this.form().allowDom(this)) {
              this.unpaint();
          }
          if (this.elem) {
              this.positionElem();
          }
          ctx.clearRect(0, 0, this.w, this.h);
          if (this.dragTarget) {
              ctx.strokeStyle = 'cornflowerblue';
          }
          else {
              ctx.strokeStyle = 'black';
          }
          ctx.lineWidth = 1;
          ctx.lineJoin = 'round';
          ctx.strokeRect(0, 0, this.w, this.h);
          if (!this.elem) {
              ctx.font = this.getFont();
              let y = 3;
              if (this.multiline) {
                  ctx.textBaseline = 'top';
              }
              else {
                  ctx.textBaseline = 'middle';
                  y = Math.round(this.h / 2);
              }
              ctx.fillStyle = this.getColor();
              const lines = this.text.split('\n');
              for (let i = 0; i < lines.length; ++i) {
                  ctx.fillText(lines[i], 3, y + i * (this.getFontSize() + 3));
              }
          }
      }
      createElem() {
          if (this.multiline) {
              this.elem = document.createElement('textarea');
          }
          else {
              this.elem = document.createElement('input');
              this.elem.type = 'text';
          }
          this.elem.value = this.text;
          this.elem.style.position = 'absolute';
          this.elem.style.boxSizing = 'border-box';
          this.elem.style.border = 'none';
          this.elem.style.background = 'none';
          this.elem.style.paddingLeft = '3px';
          this.elem.style.fontSize = this.form().surface.htmlunits(this.getFontSize()) + 'px';
          this.elem.style.fontFamily = this.getFontName();
          this.elem.addEventListener('input', (ev) => {
              this.text = this.elem.value;
              this.change.fire(new TextBoxChangeEvent(this, this.text));
          });
          this.elem.addEventListener('keypress', (ev) => {
              if (ev.keyCode === 13) {
                  this.parent.submit();
              }
          });
          this.elem.addEventListener('blur', (ev) => {
              this.unpaint();
              this.repaint();
          });
          this.context().canvas.parentElement.insertBefore(this.elem, this.context().canvas);
      }
      positionElem() {
          this.elem.style.left = this.form().surface.htmlunits(this.formX()) + 'px';
          this.elem.style.top = this.form().surface.htmlunits(this.formY()) + 'px';
          this.elem.style.width = this.form().surface.htmlunits(this.w) + 'px';
          this.elem.style.height = this.form().surface.htmlunits(this.h) + 'px';
          this.elem.style.opacity = this.context().globalAlpha.toString();
          this.elem.value = this.text;
      }
      removed() {
          this.unpaint();
      }
      allowDrop(data) {
          return typeof data === 'string';
      }
      drop(data) {
          this.setText(data);
      }
      setText(text) {
          this.text = text;
          this.repaint();
      }
  }
  class TextBox extends _TextBox {
      constructor(text) {
          super(text);
      }
      paint(ctx) {
          if (!this.elem && this.form().allowDom(this)) {
              this.createElem();
          }
          super.paint(ctx);
      }
  }
  class FocusTextBox extends _TextBox {
      constructor(text) {
          super(text);
          this.mousedown.add((data) => {
              if (this.elem) {
                  return;
              }
              this.createElem();
              this.positionElem();
              setTimeout(() => {
                  this.elem.focus();
                  if (!this.multiline) {
                      this.context().font = this.getFont();
                      for (let i = 0; i < this.text.length; ++i) {
                          if (data.x < this.context().measureText(this.text.substr(0, i)).width) {
                              this.elem.setSelectionRange(i - 1, i - 1);
                              break;
                          }
                      }
                  }
              }, 0);
              this.repaint();
          });
      }
  }
  //# sourceMappingURL=textbox.js.map

  class Label extends TextControl {
      constructor(text) {
          super(text);
          this.fit = false;
      }
      paint(ctx) {
          super.paint(ctx);
          ctx.font = this.getFont();
          ctx.textBaseline = 'middle';
          ctx.fillStyle = this.getColor();
          const lines = this.evalText().split('\n');
          const lineHeight = (this.getFontSize() + 3);
          const y = this.h / 2 - lineHeight * (lines.length - 1) / 2;
          for (let i = 0; i < lines.length; ++i) {
              ctx.fillText(lines[i], 0, y + i * lineHeight);
          }
      }
      setText(text) {
          super.setText(text);
          if (this.fit) {
              this.relayout();
          }
      }
      selfConstrain() {
          if (!this.fit) {
              return false;
          }
          this.context().font = this.getFont();
          const lines = this.evalText().split('\n');
          this.w = 0;
          for (const line of lines) {
              this.w = Math.max(this.w, Math.ceil(this.context().measureText(this.evalText()).width) + 10);
          }
          this.h = Math.max(this.form().defaultHeight(), lines.length * (this.getFontSize() + 3));
          return true;
      }
  }
  //# sourceMappingURL=label.js.map

  class Dialog extends Control {
      constructor() {
          super();
          this._modal = null;
      }
      defaultConstraints() {
          this.coords.center(CoordAxis.X);
          this.coords.center(CoordAxis.Y);
      }
      paint(ctx) {
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.lineJoin = 'round';
          const r = 6;
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.lineTo(this.w - r, 0);
          ctx.arcTo(this.w, 0, this.w, r, r);
          ctx.lineTo(this.w, this.h - r);
          ctx.arcTo(this.w, this.h, this.w - r, this.h, r);
          ctx.lineTo(r, this.h);
          ctx.arcTo(0, this.h, 0, this.h - r, r);
          ctx.lineTo(0, r);
          ctx.arcTo(0, 0, r, 0, r);
          ctx.fill();
          ctx.stroke();
          super.paint(ctx);
      }
      async modal(f) {
          return await Modal.show(this, f);
      }
      close(data) {
          if (this.parent instanceof Modal) {
              this.parent.close(data);
          }
          else {
              this.remove();
          }
      }
  }
  class AlertDialog extends Dialog {
      constructor(text) {
          super();
          const l = this.add(new Label(text), 20, 20);
          l.fit = true;
          this.add(new Button('OK'), { x2: 20, y2: 20 }).click.add(() => {
              this.close();
          });
      }
      defaultConstraints() {
          this.coords.size(420, 180);
          super.defaultConstraints();
      }
  }
  class PromptDialog extends Dialog {
      constructor(prompt) {
          super();
          const l = this.add(new Label(prompt), 20, 20);
          l.fit = true;
          this.name = this.add(new TextBox(), 20, 54);
          this.name.coords.x2.set(20);
          this.add(new Button('Cancel'), { x2: 20, y2: 20 }).click.add(() => {
              this.close('Cancel');
          });
          this.add(new Button('OK'), { x2: 190, y2: 20 }).click.add(() => {
              this.close(this.name.text);
          });
      }
      defaultConstraints() {
          this.coords.size(420, 180);
          super.defaultConstraints();
      }
      submit() {
          this.close(this.name.text);
      }
  }
  //# sourceMappingURL=dialog.js.map

  class Grabber extends Control {
      constructor(x, y) {
          super();
          this._bounds = new Map();
          this._startX = x;
          this._startY = y;
          this._bounds.set(CoordAxis.X, [null, null]);
          this._bounds.set(CoordAxis.Y, [null, null]);
          let down = null;
          this.mousedown.add((data) => {
              data.capture();
              data.cancelBubble();
              down = data;
              this._startX = this.x;
              this._startY = this.y;
          });
          this.mouseup.add((data) => {
              down = null;
          });
          this.mousemove.add((data) => {
              if (!down) {
                  return;
              }
              if (this._xConstraint) {
                  this._xConstraint.set(this.clamp(CoordAxis.X, this._startX + data.dragX));
              }
              if (this._yConstraint) {
                  this._yConstraint.set(this.clamp(CoordAxis.Y, this._startY + data.dragY));
              }
          });
      }
      clamp(axis, v) {
          const range = this._bounds.get(axis);
          if (range[0] !== null && range[0] !== undefined) {
              v = Math.max(range[0], v);
          }
          if (range[1] !== null && range[1] !== undefined) {
              v = Math.min(range[1], v);
          }
          return v;
      }
      setBound(axis, min, max) {
          this._bounds.set(axis, [min, max]);
      }
      added() {
          super.added();
          if (this._startX) {
              this._xConstraint = this.coords.x.set(this._startX);
          }
          if (this._startY) {
              this._yConstraint = this.coords.y.set(this._startY);
          }
      }
      animate(axis, min, max, duration, easing) {
          if (axis === CoordAxis.X && this._xConstraint) {
              return new CoordAnimator(this._xConstraint, min, max, duration, easing);
          }
          else if (axis === CoordAxis.Y && this._yConstraint) {
              return new CoordAnimator(this._yConstraint, min, max, duration, easing);
          }
      }
      paint(ctx) {
          super.paint(ctx);
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, this.w, this.h);
      }
  }
  //# sourceMappingURL=grabber.js.map

  class ScrollBox extends Control {
      constructor() {
          super();
          this.scrollX = 0;
          this.scrollY = 0;
          this.xmax = 0;
          this.ymax = 0;
          this.enableHitDetection();
          this.mousedown.add((ev) => {
              ev.captureDrag();
              ev.cancelBubble();
          });
          this.mousemove.add((ev) => {
              if (ev.capture) {
                  if (!this.scrollBy(ev.dx, ev.dy)) {
                      let p = this.parent;
                      while (p) {
                          if (this.parent instanceof ScrollBox) {
                              if (this.parent.scrollBy(ev.dx, ev.dy)) {
                                  return;
                              }
                          }
                          p = p.parent;
                      }
                      ev.cancelDragCapture();
                  }
              }
          });
      }
      shouldPaint(control) {
          return control.xw - this.scrollX >= 0 && control.x - this.scrollX <= this.w && control.yh - this.scrollY >= 0 && control.y - this.scrollY <= this.h;
      }
      paint(ctx) {
          ctx.translate(-this.scrollX, -this.scrollY);
          super.paint(ctx);
          ctx.translate(this.scrollX, this.scrollY);
          ctx.fillStyle = '#404040';
          if (this.xmax > this.w) {
              let w = this.w;
              if (this.ymax > this.h) {
                  w -= 12;
              }
              const sw = w * (this.w / this.xmax);
              const sx = (w - sw) * this.scrollX / (this.xmax - this.w);
              ctx.fillRect(sx, this.h - 10, sw, 7);
          }
          if (this.ymax > this.h) {
              let h = this.h;
              if (this.xmax > this.w) {
                  h -= 12;
              }
              const sh = h * (this.h / this.ymax);
              const sy = (h - sh) * this.scrollY / (this.ymax - this.h);
              ctx.fillRect(this.w - 10, sy, 7, sh);
          }
      }
      paintDecorations(ctx) {
          ctx.translate(this.scrollX, this.scrollY);
          super.paintDecorations(ctx);
          ctx.translate(-this.scrollX, -this.scrollY);
      }
      scrollBy(dx, dy) {
          const sx = this.scrollX;
          const sy = this.scrollY;
          this.scrollX -= dx;
          this.scrollY -= dy;
          this.clipScroll();
          this.repaint();
          return (dx === 0 && dy === 0) || (Math.abs(dx) > 0 && sx !== this.scrollX) || (Math.abs(dy) > 0 && sy !== this.scrollY);
      }
      clipScroll() {
          this.scrollX = Math.round(Math.min(Math.max(0, this.xmax - this.w), Math.max(0, this.scrollX)));
          this.scrollY = Math.round(Math.min(Math.max(0, this.ymax - this.h), Math.max(0, this.scrollY)));
      }
      layoutComplete() {
          super.layoutComplete();
          this.xmax = 0;
          this.ymax = 0;
          for (const c of this.controls) {
              this.xmax = Math.max(this.xmax, c.xw);
              this.ymax = Math.max(this.ymax, c.yh);
          }
          this.clipScroll();
      }
      controlAtPoint(x, y, opts) {
          return super.controlAtPoint(x + this.scrollX, y + this.scrollY, opts);
      }
      formX() {
          return super.formX() - this.scrollX;
      }
      formY() {
          return super.formY() - this.scrollY;
      }
      scrollWidth() {
          return Math.max(this.w, this.xmax);
      }
      scrollHeight() {
          return Math.max(this.h, this.ymax);
      }
  }
  //# sourceMappingURL=scrollbox.js.map

  class ListItem extends Control {
      constructor() {
          super();
          this.selected = false;
          this.select = new EventSource();
      }
      paint(ctx) {
          if (this.selected) {
              ctx.fillStyle = 'orange';
              ctx.fillRect(0, 0, this.w, this.h);
          }
          super.paint(ctx);
      }
      selfConstrain() {
          this.h = this.form().defaultHeight();
          return true;
      }
      setSelected(value) {
          if (value === this.selected) {
              return;
          }
          this.selected = value;
          this.repaint();
          if (this.selected) {
              this.select.fire();
          }
      }
  }
  class TextListItem extends ListItem {
      constructor(text) {
          super();
          this.draggable = false;
          const l = this.add(new Label(text), 5, 1, null, null, 3, 1);
          l.fit = false;
          this.mousedown.add((ev) => {
              this.setSelected(true);
              if (this.draggable) {
                  ev.allowDrag('hello');
              }
          });
      }
  }
  class CheckBoxListItem extends ListItem {
      constructor(text) {
          super();
          const c = this.add(new CheckBox(text), 3, 1, null, null, 3, 1);
      }
  }
  class List extends ScrollBox {
      constructor(itemType) {
          super();
          this.itemType = itemType;
          this.border = true;
          this.change = new EventSource();
          this.mousedown.add((ev) => {
              if (ev.control !== this) {
                  return;
              }
              for (const c of this.controls) {
                  c.selected = false;
              }
              this.change.fire();
              this.repaint();
          });
          this.keydown.add((data) => {
              if (data.key === 38) {
                  for (let i = 1; i < this.controls.length; ++i) {
                      if (this.controls[i].selected) {
                          this.controls[i].setSelected(false);
                          this.controls[i - 1].setSelected(true);
                          break;
                      }
                  }
              }
              else if (data.key === 40) {
                  for (let i = 0; i < this.controls.length - 1; ++i) {
                      if (this.controls[i].selected) {
                          this.controls[i].setSelected(false);
                          this.controls[i + 1].setSelected(true);
                          break;
                      }
                  }
              }
          });
      }
      paint(ctx) {
          super.paint(ctx);
      }
      addItem(item) {
          const itemControl = new this.itemType(item);
          itemControl.select.add(() => {
              for (const c of this.controls) {
                  if (c === itemControl) {
                      continue;
                  }
                  c.selected = false;
              }
              this.change.fire();
          });
          this.add(itemControl, { x: 0, x2: 0 });
          if (this.controls.length === 1) {
              itemControl.coords.y.set(0);
          }
          else {
              itemControl.coords.y.align(this.controls[this.controls.length - 2].coords.yh);
          }
          return itemControl;
      }
      selected() {
          for (const c of this.controls) {
              if (c.selected) {
                  return true;
              }
          }
          return false;
      }
  }
  //# sourceMappingURL=list.js.map

  class Slider extends Control {
      constructor(value, min, max, snap) {
          super();
          this.value = 0;
          this.min = 0;
          this.max = 1;
          this.snap = 0;
          this.value = value || 0;
          this.min = min || 0;
          this.max = max === undefined ? 1 : max;
          this.snap = snap;
          this.change = new EventSource();
          this.mousedown.add((data) => {
              data.capture();
              data.cancelBubble();
          });
          this.mousemove.add((data) => {
              if (!data.capture) {
                  return;
              }
              this.setValue(Math.min(1, Math.max(0, ((data.x - 8) / (this.w - 16)))) * (this.max - this.min) + this.min);
          });
      }
      setValue(v) {
          this.value = Math.min(this.max, Math.max(this.min, v));
          if (this.snap) {
              this.value = Math.round(this.value / this.snap) * this.snap;
          }
          this.change.fire();
          this.repaint();
      }
      paint(ctx) {
          super.paint(ctx);
          ctx.fillStyle = '#ff9800';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.lineJoin = 'round';
          ctx.strokeRect(0, 0, this.w, this.h);
          let x = (this.w - 16) * (this.value - this.min) / (this.max - this.min);
          ctx.fillRect(x, 2, 16, this.h - 4);
      }
      scrollBy(dx, dy) {
          const v = this.value;
          if (this.snap) {
              this.setValue(this.value + Math.sign(dy) * this.snap);
          }
          else {
              this.setValue(this.value + dy * (this.max - this.min) / 2000);
          }
          return this.value !== v;
      }
  }
  //# sourceMappingURL=slider.js.map

  //# sourceMappingURL=spacer.js.map

  class TreeItem extends Control {
      constructor(tree, node) {
          super();
          this.tree = tree;
          this.node = node;
          this.selected = false;
          this._open = false;
          this.clip = false;
          this.select = new EventSource();
          this.label = this.add(new Label(() => this.node.treeText()), 22, 1);
          this.label.fit = true;
          this.mousedown.add((ev) => {
              if (ev.y > this.label.h) {
                  return;
              }
              this.setSelected(true);
              if (ev.x < 22) {
                  this.toggle();
              }
              if (this.node.treeDrag()) {
                  ev.allowDrag(this.node);
              }
          });
          this.mousedbl.add((ev) => {
              if (ev.y > this.label.h) {
                  return;
              }
              if (ev.x > 22) {
                  this.toggle();
              }
          });
      }
      setSelected(value) {
          if (value === this.selected) {
              return;
          }
          this.selected = value;
          this.repaint();
          if (this.selected) {
              this.select.fire();
              this.tree.setSelected(this);
          }
      }
      toggle() {
          if (this._open) {
              this.close();
          }
          else {
              this.open();
          }
      }
      open() {
          this._open = true;
          this.sub = this.add(new SubTree(this.tree, this.node), { x: 22 });
          this.sub.coords.y.align(this.label.coords.yh);
          this.sub.coords.w.fit();
          this.sub.coords.h.fit(0, 20);
      }
      close() {
          if (!this._open) {
              return;
          }
          this._open = false;
          this.sub.remove();
          this.sub = null;
      }
      allowDrop(data) {
          return this.node.treeDropAllowed(data);
      }
      drop(data) {
          this.node.treeDrop(data);
          this.setSelected(true);
          this.close();
          this.open();
      }
      paint(ctx) {
          if (this.selected || this.dragTarget) {
              ctx.fillStyle = this.dragTarget ? 'cornflowerblue' : 'orange';
              ctx.fillRect(0, 0, this.tree.scrollWidth(), this.label.h);
          }
          const arrowX = 22 / 2;
          const arrowY = this.label.h / 2;
          ctx.beginPath();
          if (this._open) {
              ctx.moveTo(arrowX - 5, arrowY - 4);
              ctx.lineTo(arrowX + 5, arrowY - 4);
              ctx.lineTo(arrowX, arrowY + 4);
          }
          else {
              ctx.moveTo(arrowX - 4, arrowY - 5);
              ctx.lineTo(arrowX + 4, arrowY);
              ctx.lineTo(arrowX - 4, arrowY + 5);
          }
          ctx.closePath();
          ctx.fillStyle = 'black';
          ctx.fill();
          super.paint(ctx);
      }
      inside(x, y) {
          return x >= 0 && y >= 0 && y < this.h;
      }
  }
  class SubTree extends Control {
      constructor(tree, parentNode) {
          super();
          this.tree = tree;
          this.parentNode = parentNode;
          this.loading = false;
          this.clip = false;
      }
      addItem(node) {
          const ti = this.add(new TreeItem(this.tree, node), { x: 0 });
          if (this.controls.length === 1) {
              ti.coords.y.set(0);
          }
          else {
              ti.coords.y.align(this.controls[this.controls.length - 2].coords.yh);
          }
          ti.coords.w.fit();
          ti.coords.h.fit();
      }
      added() {
          super.added();
          if (this.parentNode) {
              this.loading = true;
              this.parentNode.treeChildren().then(children => {
                  this.loading = false;
                  for (const node of children) {
                      this.addItem(node);
                  }
              });
          }
      }
      paint(ctx) {
          super.paint(ctx);
          if (this.loading) {
              ctx.fillStyle = 'grey';
              ctx.fillRect(6, this.h / 2 - 1, 2, 2);
              ctx.fillRect(12, this.h / 2 - 1, 2, 2);
              ctx.fillRect(18, this.h / 2 - 1, 2, 2);
          }
      }
      inside(x, y) {
          return x >= 0 && y >= 0 && y < this.h;
      }
  }
  class Tree extends ScrollBox {
      constructor() {
          super();
          this.border = true;
          this.change = new EventSource();
          this.sub = new SubTree(this, null);
      }
      added() {
          super.added();
          this.add(this.sub, 0, 0);
          this.sub.coords.w.fit();
          this.sub.coords.h.fit();
      }
      addRoot(node) {
          this.sub.addItem(node);
      }
      setSelected(node) {
          if (this.selected && this.selected !== node) {
              this.selected.setSelected(false);
          }
          this.selected = node;
          node.setSelected(true);
      }
  }
  //# sourceMappingURL=tree.js.map

  //# sourceMappingURL=index.js.map

  //# sourceMappingURL=index.js.map

  const form = new Form(new Surface('canvas'));
  const demoList = form.add(new List(TextListItem), { x: 10, y: 10, y2: 10 });
  const grabber = form.add(new Grabber(200), { y: 10, w: 20, y2: 10 });
  const c = form.add(new ScrollBox(), { y: 10, x2: 10, y2: 10 });
  c.border = true;
  demoList.coords.xw.align(grabber.coords.x);
  c.coords.x.align(grabber.coords.xw);
  grabber.setBound(CoordAxis.X, 100, 400);
  demoList.change.add(() => {
      if (!demoList.selected()) {
          c.clear();
      }
  });
  function makeDemo(name, fn) {
      const item = demoList.addItem(name);
      item.select.add(() => {
          c.clear();
          fn();
      });
  }
  function delay(ms) {
      return new Promise(function (resolve) {
          setTimeout(function () {
              resolve();
          }, ms);
      });
  }
  class FillDialog extends Dialog {
      constructor() {
          super();
          const cancel = this.add(new Button('Cancel'), { x2: 20, y2: 20 });
          cancel.click.add(() => {
              this.close('Cancel');
          });
      }
      defaultConstraints() {
          this.coords.x.set(20);
          this.coords.y.set(20);
          this.coords.x2.set(20);
          this.coords.y2.set(20);
      }
  }
  makeDemo('Modal', () => {
      const b = c.add(new Button('Alert'), 10, 10);
      b.click.add(async () => {
          await new AlertDialog('You clicked the button!').modal(form);
      });
      const b2 = c.add(new Button('Prompt'), 10, 100);
      const l = c.add(new Label(), 20, 150);
      b2.click.add(async () => {
          const result = await new PromptDialog('Enter some text:').modal(form);
          l.setText('You clicked: ' + result);
      });
      const b3 = c.add(new Button('Fill'), 10, 190);
      b3.click.add(() => {
          new FillDialog().modal(form);
      });
  });
  makeDemo('Center', () => {
      const b = c.add(new Button('Click me'));
      b.coords.size(160, 60);
      b.coords.center(CoordAxis.X);
      b.coords.center(CoordAxis.Y);
      b.click.add(() => {
          b.setText('Thanks');
      });
  });
  makeDemo('Fill', () => {
      const buttons = [
          new Button('Add more!'),
      ];
      function update() {
          for (const b of buttons) {
              b.remove();
          }
          buttons.push(new Button('Button ' + buttons.length));
          for (const b of buttons) {
              c.add(b, null, 20);
          }
          FillConstraint.fillParent(buttons, CoordAxis.X, 10);
      }
      buttons[0].click.add(() => {
          update();
      });
      update();
  });
  makeDemo('Fill + Align', () => {
      const b1 = c.add(new Button('Fill 1'), 10, 20);
      const b2 = c.add(new Button('Fill 2'), null, 20);
      const b3 = c.add(new Button('Aligned to 2'), null, 20);
      b3.coords.x2.set(10);
      new FillConstraint([b1, b2], Coord.W);
      b2.coords.w.align(b3.coords.w);
      b2.coords.x.align(b1.coords.xw, 10);
      b3.coords.x.align(b2.coords.xw, 10);
  });
  makeDemo('CheckBox', () => {
      const cb = c.add(new CheckBox('Enabled'), 10, 10);
      const b = c.add(new Button('Click me'), 10, 50);
      b.click.add(() => {
          if (cb.checked) {
              b.setText('Thanks');
              setTimeout(() => {
                  b.setText('Click me');
              }, 1000);
          }
      });
      const r = new RadioGroup();
      for (let i = 0; i < 5; ++i) {
          const cb = c.add(new CheckBox('Radio ' + i), 10, 100 + i * 40);
          r.add(cb);
      }
  });
  makeDemo('Slider', () => {
      const s1 = c.add(new Slider(4, 0, 20, 1), 10, 10, 400);
      const l1 = c.add(new Label('4'), 420, 10);
      s1.change.add(() => {
          l1.setText(s1.value.toString());
      });
      const s2 = c.add(new Slider(20, 0, 100), 10, 50, 400);
      const l2 = c.add(new Label('20'), 420, 50);
      s2.change.add(() => {
          l2.setText((Math.round(s2.value * 10) / 10).toString());
      });
  });
  makeDemo('TextBox', () => {
      const t1 = c.add(new TextBox('Regular textbox'), 10, 10, 300);
      const l1 = c.add(new Label(t1.text), 10, 50);
      l1.fit = true;
      t1.change.add(() => {
          l1.setText(t1.text);
      });
      const t2 = c.add(new FocusTextBox('Created when focused'), 10, 140, 300, 60);
      const l2 = c.add(new Label(t2.text), 10, 210);
      l2.fit = true;
      t2.change.add(() => {
          l2.setText(t2.text);
      });
      const t3 = c.add(new FocusTextBox('Multi\nline\ntextbox'), 400, 10, 300, 200);
      t3.multiline = true;
      const l3 = c.add(new Label(t3.text), 400, 220);
      l3.fit = true;
      t3.change.add(() => {
          l3.setText(t3.text);
      });
  });
  makeDemo('Grabber', () => {
      const g = c.add(new Grabber(100, 100));
      g.coords.size(30, 30);
      g.setBound(CoordAxis.X, 50);
      g.setBound(CoordAxis.Y, 50);
      const l = c.add(new Label('Follow'));
      l.coords.x.align(g.coords.xw, 10);
      l.coords.y.align(g.coords.yh, 10);
  });
  class CustomListItem extends ListItem {
      constructor(text) {
          super();
          const b = this.add(new Button(''), { x: 3, y: 3, w: 20, y2: 3 });
          b.click.add(() => {
              this.setSelected(true);
          });
          this.add(new Label(text), { x: 30, y: 3, x2: 3, y2: 3 });
      }
      selfConstrain() {
          this.h = 40;
          return true;
      }
  }
  makeDemo('List', () => {
      const textList = c.add(new List(TextListItem), 10, 10, 200, 500);
      for (let i = 0; i < 100; ++i) {
          textList.addItem('Item ' + i);
      }
      const checkList = c.add(new List(CheckBoxListItem), 220, 10, 200, 500);
      for (let i = 0; i < 100; ++i) {
          checkList.addItem('Task ' + i);
      }
      const customList = c.add(new List(CustomListItem), 440, 10, 200, 500);
      for (let i = 0; i < 100; ++i) {
          customList.addItem('Action ' + i);
      }
  });
  class DemoTreeNode {
      constructor(name, parent) {
          this.name = name;
          this.parent = parent;
          this.extra = [];
      }
      treeText() {
          return this.name;
      }
      async treeChildren() {
          await delay(300);
          let children = [];
          for (let i = 0; i < 5; ++i) {
              children.push(new DemoTreeNode(this.name + '.' + i, this));
          }
          for (const e of this.extra) {
              children.push(e);
          }
          return children;
      }
      treeDrag() {
          return true;
      }
      treeDropAllowed(data) {
          if (data === this || data.parent === this) {
              return false;
          }
          return true;
      }
      treeDrop(data) {
          this.extra.push(data);
      }
  }
  makeDemo('Tree', () => {
      const tree = c.add(new Tree(), 10, 10, 200, 500);
      tree.addRoot(new DemoTreeNode('A'));
      tree.addRoot(new DemoTreeNode('B'));
  });
  makeDemo('Button', () => {
      const b1 = c.add(new Button('Hello'), 10, 10);
      b1.click.add(async () => {
          b1.setText('Goodbye');
          await delay(1000);
          b1.setText('Hello');
      });
      const g1 = c.add(new ButtonGroup(), 10, 100, 400, 32);
      const gb1 = g1.add(new Button('One'));
      const gb2 = g1.add(new Button('Two'));
      const gb3 = g1.add(new Button('Three'));
      const gb4 = g1.add(new Button('Four'));
      const gb5 = g1.add(new Button('Five'));
      gb1.click.add(() => {
          const bx = g1.add(new Button('More!'));
      });
  });
  makeDemo('Animation', () => {
      const b1 = c.add(new Button('Here'), null, 10);
      const a1 = b1.coords.x.set(10).animate(10, 800, 1000, Easing.easeInOutCubic);
      b1.click.add(async () => {
          await a1.start();
          b1.setText('There');
      });
      for (let i = 0; i < 6; ++i) {
          const b = c.add(new Button(`${i}`), 10 + i * 170, 50);
          b.click.add(async () => {
              await new OpacityAnimator(b, 1, 0.1, 200).start();
              b.remove();
          });
      }
      const b3 = c.add(new Button('Open / Close'), 10, 100);
      b3.click.add(() => {
          if (grabber.x > 110) {
              grabber.animate(CoordAxis.X, grabber.x, 100, 100).start();
          }
          else {
              grabber.animate(CoordAxis.X, grabber.x, 400, 100).start();
          }
      });
  });
  makeDemo('Opacity', () => {
      for (let i = 0; i < 10; ++i) {
          const b = c.add(new Button(`${(i + 1) / 10}`), 10 + i * 56, 10 + i * 16);
          b.opacity = (i + 1) / 10;
      }
  });
  makeDemo('Scrolling', () => {
      const s1 = c.add(new ScrollBox(), 10, 10, 200, 300);
      s1.border = true;
      const s2 = s1.add(new ScrollBox(), 10, 200, 180, 300);
      s2.border = true;
      const sl = s2.add(new Slider(), 10, 300, 140);
      const l1 = s1.add(new Label('hello'), 10, 600);
      const l2 = s2.add(new Label('hello'), 10, 600);
  });
  //# sourceMappingURL=demo.js.map

}());
//# sourceMappingURL=demo.bundle.js.map
