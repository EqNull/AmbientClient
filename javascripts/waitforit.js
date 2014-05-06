/// <reference path="base.js" />

//var started = new Date();
//
//var callbacktest = function(counter, cb) {
//    counter = 0;
//
//    var _cb = function() {
//        setImmediate(function(){
//            if (counter < 1000000) {
//                counter++;
//                _cb();
//            } else {
//                cb(counter);
//            }
//        });
//    }
//    _cb();
//}
//
//function speedtestvanilla() {
//    callbacktest(0, function(counter) {
//        console.log("Counter: " + counter + " in " +  (new Date() - started));
//    });
//}
//
//speedtestvanilla();
//

__ec = 0;

var ew = {
    none: __ec++
    , error : __ec++
    , "if": __ec++
    , "else": __ec++

    //Loop types
    , loop: __ec++
    , "while": __ec++
    , repeat: __ec++
    , unless: __ec++
    , until: __ec++
}


var counter = 1;

var cWaitforit = function(fn, type, current) {
    this.fn = fn;
    if (type) { this.type = type; }

    if (current) {
        this.root = current.root;
        if (current.type >= ew.loop) {
            this._prev = current;
        }
        current._next = this;
    } else {
        this.root = this;
    }
//    this.id = counter++;
}

cWaitforit.prototype = {
    "do": function(fn) {
        return new cWaitforit(fn, 0, this);
    }
    , "catch": function(fn) {
        return new cWaitforit(fn, ew.error, this);
    }
    , loop: function(count, fn) {
        if (count <= 0) { return this; }

        var next = new cWaitforit(null, ew.loop, this);

        next.loop = count;
        next.counter = -1;
        if (fn) {
            return next.do(fn);
        }
        return next;
    }
    , call: function() {
        var fn = this.fn

        if (fn) {
            var result = this.fn.apply(this, arguments);

            if (result instanceof cWaitforit) {
                result.root.cb = this;
                return;
            } else if (result != undefined) {
                if (this.type == ew.error) {
                    arguments[0] = result;
                } else {
                    arguments[1] = result;
                }
            }
        }
        this.next.apply(this, arguments);
    }
    , next: function() {
        if (arguments[0] && arguments[0].constructor == Error) {
            this.error.apply(this, arguments);
        }

        if (!this.type) {
            var next = this._prev || this._next;
        } else {
            var next = this._findnext.apply(this, arguments)
        }
        if (next) { return next.call.apply(next, arguments); }

        next = this.root.cb;
        if (!next) { return; }

        next.next.apply(next, arguments);
    }
    , _findnext: function() {
        var skipnext = this._next;
        if (skipnext) { skipnext = skipnext._next };
        var next;

        switch (this.type) {
            case ew.error:
                next = this._next;
                break;
            case ew.loop:
                if (this.counter == -1) {
                    this.results = [];
                } else {
                    this.results[this.counter] = arguments[1];
                }

                this.counter++;

                if (this.counter < this.loop) {
                    next = this._next || this._prev;
                    arguments[0] = this.counter;
                } else {
                    this.counter = -1;
                    next = this._prev || skipnext;
                    arguments = [null, this.results]
                }
                break;
        }

        if (next) { return next.call.apply(next, arguments); }

        next = this.root.cb;
        if (!next) { return; }

        next.next.apply(next, arguments);
    }
    , start: function() {
        args = Array.prototype.slice.call(arguments)
        args.unshift(null);

        this.root.call.apply(this.root, args);
        return this;
    }
}


var waitforit = function(fn) {
    return new cWaitforit(fn);
}

//setImmediate: (function() {
//    if (typeof setImmediate == "function") {
//        return setImmediate;
//    } else {
//        return function(fn) { setTimeout(fn,  0); }
//    }
//}) ()


var start = new Date();

var x = waitforit()
    .do(function() {
        debug.log("a");
    })
    .loop(5)
        .do(function(index) {
            debug.log("b " + index);
            return index;
        })
    .do(function(err, data) {
        debug.log("Moo: " + data)

        debug.log("end");
    })

//debug.timerstart();


//for (var index = 1; index <= 10000; index++) {
//    x = x.do(function(err, data) {
//            var t = waitforit();
//            setImmediate(function() {
//                t.next(null, data + 1);
//            });
//            return t;
//    })
//};

//debug.log("Done adding");

//x.do(function(err, data) {
//        debug.log("Moo: " + data)
//    })
//    .start(0);

//
//var x = x.root;
//while(x) {
//    console.log(x.id + " : " + x.type);
//    x = x._next;
//}
//




//var start = new Date();
//
//var startx = x = new Deferred()
//
//for (var index = 1; index <= 1000000; index++) {
//    x = x.next(function(data) {
////        console.log("moo " + data);
//        //        if (x % 1000 == 0) {
//        var t = new Deferred();
//        setImmediate(function() {
//            t.call(data + 1);
//        });
//        return t;
//    })
//};
//
//console.log(new Date() - start)
//x.next(function(data) {
//    console.log(new Date() - start)
//    console.log("Moo: " + data)
//})
//
//    startx.call(1);


