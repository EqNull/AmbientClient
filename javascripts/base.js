library = function (scope) {
    if (!scope) { return; }

    scope.crlf = "\r\n";
    scope.lf = "\n";
    scope.cr = "\r";

    //Example:
    //var Base = object.create({
    //    create: function() { } 
    //    , method: function() { }
    //})
    //var Inherited = object.create(Base, {
    //    method: function() {
    //        this._super.method(arguments); 
    //    }
    //    , onevent: function(arg1, arg2) {
    //        this.__raise("onevent", arguments)
    //    }
    //})

    var argumentarray = function () {
        return Array.prototype.slice.call(arguments)
    }

    var baseobject = function () { }

    baseobject.prototype = {
        get: function (name) {
            if (typeof this[name] == "function") {
                return this[name] ()
            } else {
                return this[name]
            }
        }
        , set: function(name, value) {
            if (typeof this[name] == "function") {
                return this[name] (value)
            } else {
                this[name] = value
                return this
            }
        }
        , clone: function () { }             //todo
        , serialize: function () { }         //todo
        , unserialize: function () { }       //todo
        , raise: function (event) {
            var args = Array.prototype.slice.call(arguments)
            if (typeof event == "object") {
                var eventname = "on" + event.name
            } else {
                var eventname = "on" + event
                args[0] = new cEvent(event, this)
            }


            if (this[eventname] && this[eventname] != this.raise) {
                this[eventname].apply(this, args)
            }

            eventname += "_" + this.groupname
            if (this.parent && this.parent[eventname]) { this.parent[eventname].apply(this.parent, args) }
            if (this.relative && this.relative[eventname]) { this.relative[eventname].apply(this.relative, args) }
            if (this.root && this.root[eventname]) { this.root[eventname].apply(this.root, args) }
            return this
        }
    }

    scope.emitevents = function (eventname) {
        return function (event) {
            if (typeof event == "function") {
                if (!this.__events) { this.__events = {} }
                if (!this.__events[eventname]) { this.__events[eventname] = [] }
                this.__events[eventname].push(event)
                return this;
            } else {
                if (!this.__events) { return }
                var __events = this.__events[eventname]
                if (__events) {
                    for (var __index in __events) {
                        __events[__index].apply(this, arguments)
                    }
                }
            }
        }
    }

    scope.object = (function () {
        return {
            create: function (_super, prototype) {
                var fn;

                if (_super && (_super.constructor == Object)) {
                    prototype = _super;
                    _super = null;
                }

                if (prototype && (typeof prototype == "function")) {

                    if (_super) { //Get intellisense to work
                        var __clone = function() { }
                        __clone.prototype = _super.prototype
//                        prototype = prototype.call(new __clone(), _super)

                        var clone = new __clone()
                        prototype = prototype.call(clone, clone)
                    } else {
                        prototype = prototype(null)
                    }
                }

                if (prototype) {
                    fn = prototype["create"];
                }

                //if (_super) {
                //    //Alert: Not supported by older browsers
                //    //Todo: To support older browsers, don't turn create into a constructor, but use the method done by crockford and / or jquery
                //    fn.prototype = Object.create(_super.prototype)
                //}

                if (!_super) {
                    _super = baseobject
                    if (!fn) {
                        fn = function () { _super.apply(this, arguments) }
                    }
                } else if (!fn) {
                    fn = function () { }
                }

                if (_super) {
                    function __() { this.constructor = fn; }
                    __.prototype = _super.prototype;
                    fn.prototype = new __();
                }

//                this.extend(fn.prototype, baseobject)
                if (prototype) this.extend(fn.prototype, prototype)
                return fn;
            }

            , extend: function(target, source) {
                var _source = source.prototype ? source.prototype : source;

                for (var index in _source) {
                    if (_source.hasOwnProperty(index)) {
                        if (_source[index] == scope.emitevents) {
                            target[index] = scope.emitevents(mid$(index, 3))

                        } else {
                            target[index] = _source[index]
                        }
                    }
                }
            }
        }

    })();

    scope.cEvent = scope.object.create({
        name: ""
        , source: null
        , create: function (eventname, source) {
            this.name = eventname
            this.source = source
        }
    })
    
    scope.isarray = function (value) {
        return (value && value.constructor == Array);
    }

    scope.arrayinsert = function (array, index, insert) {
        if (insert.constructor == Array) {
            array.splice.apply(array, [index, 0].concat(insert));
        } else {
            array.splice(index, 0, insert)
        }
        return array
    }

    scope.isfunction = function (value) {
        return (value && value.constructor == Function)
    }

    scope.isobject = function (value) {
        return (value && value.constructor == Object)
    }

    var __truevalues = {
        "y": true,
        "yes": true,
        "t": true,
        "true": true
    };

    scope.cbool = function (value) {
        if(typeof value == "string") {
            return __truevalues[value.toLowerCase()] || false;
        }
        return !!value;
    }

    scope.now = function() {
        return new Date();
    }

    scope.cdate = function(value) {
        if ((value == null) || (value == "")) { return new Date() };

        if (isstring(value)) {
            if (value.indexOf("-")) {
                var splitted = value.split("-");
                if (splitted.length == 3) {
                    if (splitted[2].length == 4) {
                        value = splitted[2] + "/" + splitted[1] + "/" + splitted[0];
                    }
                } else {
                    value = replace$(value, "-", "/");
                }
            }
        }
        return new Date(value);
    }

    //Don't change the order
    vtnull = 0;
    vtstring = 1;
    vtbool = 2;
    vtnumber = 3;
    vtdate = 4;
    vtregexp = 5;
    vtfunction = 6;
    vtobject = 7;
    vtarray = 8;

    vartype = function(value) {
        if(value == null) { return vtnull; }
        switch(value.constructor) {
            case String: {   return vtstring; }
            case Number: {   return vtnumber; }
            case Boolean: {  return vtbool; }
            case Function: { return vtfunction; }
            case Date: {   return vtdate; }
            case Array: {  return vtarray; }
            case RegExp: { return vtregexp; }
            case Object: {  return vtobject; }
        }
    }

    , random = function (max) {
        return Math.floor(Math.random() * max) + 1
    }

    , roundto = function(value, divider) {
        return Math.round(value / divider) * divider;
    }

    , floorto = function(value, divider) {
        return Math.floor(value / divider) * divider;
    }

    , doevents = function () {
        if (typeof setImmediate == "function") {
            return setImmediate;
        } else {
            return function (fn) { setTimeout(fn, 0); }
        }
    }

    scope.asc = function(str) {
        return ((str || "") + "").charCodeAt(0);
    }

    scope.chr$ = function(value) {
        return String.fromCharCode(value || 0);
    }

    scope.trim$ = function(str) {
        return ("" + (str || "")).replace(/^\s*/, "").replace(/\s*$/, "");
    }

    scope.ltrim$ = function(str) {
        return ("" + (str || "")).replace(/^\s*/, "");
    }

    scope.rtrim$ = function(str) {
        return ("" + (str || "")).replace(/\s*$/, "");
    }

    scope.split$ = function(str, delimiter) {
        str = "" + (str || "");
        if (str == "") { return []; }
        return str.split(delimiter);
    }

    scope.splittrim$ = function(str, delimiter) {
        str = scope.trim$(str);
        if (str == "") { return []; }
        return str.split(new RegExp("\\s*" + delimiter + "\\s*"));
    }

    scope.string$ = function(count, fillchar) {
        return new Array(count + 1).join(fillchar);
    }

    scope.padleft$ = function(str, fillchar, count) {
        str = (str || "") + "";

        var lenstr = str.length;

        if (lenstr >= count) return str;
        return string$(count - lenstr, fillchar) + str;
    }

    scope.padright$ = function(str, fillchar, count) {
        str = (str || "") + "";

        var lenstr = str.length;

        if (lenstr >= count) return str;
        return str + string$(count - lenstr, fillchar);
    }


    scope.instr$ = function (str, search, pos) {
        search = (search || "").toLowerCase();
        str = (str || "").toLowerCase();

        return str.indexOf(search, pos - 1) + 1;
    }

    scope.instrrev$ = function (str, search, pos) {
        search = (search || "").toLowerCase();
        str = (str || "").toLowerCase();

        if (pos) {
            return str.lastIndexOf(search, pos - 1) + 1;
        } else {
            return str.lastIndexOf(search) + 1;
        }
    }

    scope.compare$ = function(value1, value2) {
        return value1 > value2? 1: value1 < value1? -1: 0
    }

    scope.match$ = function(str, search) {
        search = (search || "").toLowerCase();
        str = (str || "").toLowerCase();

        var length = search.length;

        if ((length > 0) && (search.charAt(length - 1) == "*")) {
            return (str.substr(0, length - 1) == search.substr(0, length - 1));
        } else {
            return str == search;
        }
    }

    scope.left$ = function(str, pos) {
        if (pos <= 0) { return ""; }

        str = "" + (str || "");
        return str.substring(0, pos);
    }

    scope.right$ = function(str, pos) {
        if (pos <= 0) { return ""; }

        str = "" + (str || "");
        var length = str.length - pos;
        if (length > 0) { return str.substring(length); }
        return str;
    }

    scope.mid$ = function(str, pos, length) {
        str = "" + (str || "");
        if (pos > 0) {
            if (!length) { return str.substr(pos - 1); }
            if (length > 0) return str.substr(pos - 1, length);
        }
        return "";
    }

    scope.sub$ = function(str, posb, pose) {
        str = "" + (str || "");
        if (posb > 0) { return str.substring(posb - 1, pose); }
        return "";
    }

    scope.replace$ = function(str, search, replace) {
        return ("" + (str || "")).split(search).join(replace);
    }

    scope.lcase$ = function(str) {
        return ("" + (str || "")).toLowerCase();
    }

    scope.ucase$ = function(str) {
        return ("" + (str || "")).toUpperCase();
    }

    scope.key$ = function(line, delimiter, greedy) {
        line = "" + (line || "");

        delimiter = delimiter || "=";
        if(greedy) {
            var pos = line.lastIndexOf(delimiter);
        } else {
            var pos = line.indexOf(delimiter);
        }
        return scope.trim$((pos >= 0 ? line.substring(0, pos) : line));
    }

    scope.value$ = function(line, delimiter, greedy) {
        line = "" + (line || "");

        delimiter = (delimiter || "=") + "";
        if(greedy) {
            var pos = line.lastIndexOf(delimiter);
        } else {
            var pos = line.indexOf(delimiter);
        }
        return (pos > 0 ? scope.trim$(line.substring(pos + delimiter.length)) : "");
    }


    //Replace $pattern$ in text with params[pattern]
    //Example (json):  format$("replace $1st$ for $2nd$", {"1st": "this", "2nd": "that" })  => returns "replace this for that"
    //Example (array): format$("replace $0$ for $1$", ["this","that"] )                     => returns "replace this for that"
    scope.format$ = function(text, params) {
        if (params && (params.constructor != Array)) {
            params = Array.prototype.slice.call(arguments);
        }
        return ("" + (text || "")).replace(/(\$\S*?\$)/gi, function (pattern) {
            return params[pattern.substring(1, pattern.length - 1)] || pattern;
        });
    }

    //partindex to partindex + length as a new string.
    //Example parts(1.2.3.4.5, ".", 2, 1) => 2.3
    function part$(str, delim, partindex, length) {
        length = length || 1;

        var parts = ("" + str).split(delim);
        var result = "";

        while ((length > 0) && (parts.length >= partindex)) {
            if (result) {
                result += delim;
            }
            result += parts[partindex - 1];
            partindex++;
            length--;
        }
        return result;
    }

    scope.paste$ = function (str, add, insert, follow) {
        add = add || ""
        follow = follow || ""

        if(add) {
            return ("" + (str || "")) + insert + add + follow;
        } else {
            return ("" + (str || ""));
        }
    }

    scope.isbetween = function (value, floor, ceil) {
        if ((value > floor) && (value < ceil)) {
            return true
        }
        return false
    }

    scope.between = function(newvalue, floor, ceil) {
        if (newvalue < floor) {
            newvalue = floor;
        } else if (newvalue > ceil) {
            newvalue = ceil;
        }
        return newvalue;
    }

    scope.splitcommandline = function(line, delim) {
        var result = { };
        delim = delim || "&";
        if(line == "") {
            return result;
        }
        var splitted = line.split(delim);
        var index;
        for(index in splitted) {
            var key = key$(splitted[index], "=").toLowerCase();
            var value = decodeURIComponent(value$(splitted[index], "="));
            result[key] = value;
        }
        return result;
    }

    scope.inarray = function(ar, search, ignorecase, fieldname) {
        var index;
        var item;

        if (ignorecase) { search = search.toLowerCase(); }

        for (index in ar) {
            if (fieldname) {
                item = ar[index][fieldname];
            } else {
                item = ar[index];
            }

            if (ignorecase) {
                item = ("" + item).toLowerCase();
            }
            if (item == search) {
                return index;
            }
        }
        return -1;
    }

    scope.insortedarray = function(items, key) {
        var low = 0
        var itemcount = item.length - 1
        var high = itemcount
        var found

        if (ignorecase) { key = key.toLowerCase() }

        if (itemcount == 0) {
            return -1
        } else {
            while (low <= high) {
                find = low + Math.round((high - low) / 2)

                switch (compare$(key, items[find].toLowerCase())) {
                    case 0:
                        return find
                    case -1:
                        high = find - 1
                    case 1:
                        low = find + 1
                }
                if (low > high) { find += 1 }
            }
            find = -find || -1
        }
        return find
    }
    
    scope.clone = function(source, recursive) {
        var result;
        var prop;

        var sourcetype = vartype(source);

        if (sourcetype <= vtfunction) { return source; }

        if (sourcetype == vtarray) {
            result = [];
        } else {
            result = {};
        }

        for (prop in source) {
            if (!recursive || (vartype(source[prop]) <= vtfunction)) {
                result[prop] = source[prop];
            } else {
                result[prop] = scope.clone(source[prop]);
            }
        }
        return result
    }

    scope.merge = function(target, source, overwrite) {
        var prop;
        var value;
        var oldvalue;

        var sourcetype = vartype(source);
        if (sourcetype <= vtfunction) { return target; }

        if (!target) {
            if (sourcetype == vtarray) {
                target = [];
            } else {
                target = {};
            }
        }

        for (prop in source) {
            value = source[prop];
            if ((value != null) || (value != "")) {

                if (vartype(value) <= vtfunction) {

                    if (overwrite || (target[prop] == null) || (target[prop] == "")) {
                        target[prop] = value;
                    }
                }
            } else {
                target[prop] = merge(target[prop], source[prop], overwrite);
            }
        }
        return target;
    }

    var lang_months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
    var lang_shortmonths = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    var lang_days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
    var lang_shortdays = ["zo", "ma", "di", "wo", "do", "vr", "za"];

    var lang_today = "vandaag";
    var lang_yesterday = "gisteren";
    var mmsecsinday = 24 * 60 * 60 * 1000;

    scope.formatdate = function (d, format) {
        switch (format) {
            case "shortdate":
                var today = roundto((new Date()).valueOf(), mmsecsinday);
                yesterday = today - mmsecsinday;

                if (d.valueOf() >= today) {
                    format = "hh:mm";
                } else if (d.valueOf() >= yesterday) {
                    return lang_yesterday;
                } else {
                    format = "dd mmm yyyy";
                }
                break;
        }

        return format.replace(/(yyyy|:mm|mm|dd|d|hh|h|nn|ss)/gi,
            function($1) {
                switch ($1.toLowerCase()) {
                    case "yyyy": return d.getFullYear();
                    case "mmmm": return lang_months[d.getMonth()];
                    case "mmm": return lang_shortmonths[d.getMonth()];
                    case "mm": return padleft$(d.getMonth() + 1, "0", 2);
                    case "dddd": return lang_days[d.getDay()];
                    case "ddd": return lang_shortdays[d.getDay()];
                    case "dd": return padleft$(d.getDate(), "0", 2);
                    case "d": return d.getDate();
                    case "hh": return padleft$(d.getHours(), "0", 2);
                    case "h": return d.getHours();
                    case ":mm": return ":" + padleft$(d.getMinutes(), "0", 2);
                    case "nn": return padleft$(d.getMinutes(), "0", 2);
                    case "ss": return padleft$(d.getSeconds(), "0", 2);

                    //case "yyyy": return d.getUTCFullYear();
                    //case "mmmm": return lang_months[d.getMonth()];
                    //case "mmm": return lang_shortmonths[d.getMonth()];
                    //case "mm": return PadLeft$(d.GetUTCMonth() + 1, "0", 2)
                    //case "dddd": return lang_days[d.getDay()];
                    //case "ddd": return lang_shortdays[d.getDay()];
                    //case "dd": return PadLeft$(d.GetUTCDate(), "0", 2)
                    //case "d": return d.GetUTCDate()
                    //case "hh": return PadLeft$(d.GetUTCHours(), "0", 2)
                    //case "h": return d.GetHours()
                    //case ":mm": return ":" + PadLeft$(d.GetUTCMinutes(), "0", 2)
                    //case "nn": return PadLeft$(d.GetUTCMinutes(), "0", 2)
                    //case "ss": return PadLeft$(d.GetUTCSeconds(), "0", 2)
                }

            });
    }


    //    var unescapemap = { "&lt;": "<", "&gt;": ">", "&apos;": "'", "&amp;": "&" };  //"&quot;": "\"",
    var unescapemap = { "&lt;": "<", "&gt;": ">", "&apos;": "'", "": "\"", "&amp;": "&" }; //{ "&lt;": "<", "&gt;": ">", "&apos;": "'", "&quot;": "\"", "&amp;": "&" }

    scope.unescape$ = function (str) {
        str = ("" + str).replace(/\&.*?;/g, function (value) {
            var result = unescapemap[value];
            return result ? result : value;
        });
        return str;
    };

    //Based on John Resig's micro template engine. http://ejohn.org/blog/javascript-micro-templating/
    scope.template$ = function (str, data) {
        str = unescape$(str)
            .replace(/[\r\t\n]/g, " ")
            .split("[%").join("\t")
            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
            .replace(/\t=(.*?)%\]/g, "',$1,'")
            .split("\t").join("');")
            .split("%]").join("print('")
            .split("\r").join("\\'");

        var fn = new Function("obj",
          "var p=[], print=function() {for (var index in arguments) {(p.push(arguments[index] || \"\"))} };" +
          // Introduce the data as local variables using with(){}
          "with(obj){p.push('" +
            str
        + "');}return p.join('');");

        return fn(data);

    };

//######################################################################
//Math
//######################################################################
    scope.dec2letter = function (index) {
        var remain = 0;
        var result = ""

        do {
            remain = index % 26
            result = String.fromCharCode(64 + remain) + result
            index -= remain
            index /= 26
        } while (index)

        return result
    }

    scope.letter2dec = function (code) {
        var len = code.length;
        result = 0;

        for (var index = 0; index < len; index++) {
            result *= 26
            result += (code.charCodeAt(index) - 64)
        }

        return result
    }

    scope.hex2 = function (dec) {
        var hex = "0123456789ABCDEF"
        return hex.charAt((dec >> 4) & 15) + hex.charAt(dec & 15)
    }

    scope.rgb = function (red, green, blue) {
        return "#" + hex2(red) + hex2(green) + hex2(blue)
    }


//######################################################################
//Debugging
//######################################################################
    scope.debug = (function () {
        this.starttime = new Date();

        var result = {
            timerstart: function () {
                this.starttime = new Date();
            }

            , timerstop: function () {
                var result = new Date() - this.starttime;
                this.starttime = new Date();
                return result;
            }

            , log: function (text) {
                var out = typeof text == "object"? JSON.stringify(text) : text
                out = result.timerstop() + ": " + out;

                if ((typeof Debug !== "undefined") && Debug.writeln) {
                    Debug.writeln(out)
                } else if ((typeof console !== "undefined") && console.log) {
                    console.log(out)
                }
            }

            , breakpoint: function() {}
        }
        return result;
    })();

//######################################################################
//Data
//######################################################################
    var cJson = function (document) {
        this.document = document;
    }

    cJson.prototype = {
        edit: function () {
            this.__old = {}
            for (var index in this.document) {
                this.__old[index] = this.document[index];
            }
        }
        , setnames: function () {
            var item;
            var index;

            for (index in this.document) {
                item = this.document[index]
                if (!item.name && (item.name.charAt[0] != "_")) {
                    item.name = index;
                }
            }
        }
        , update: function() {}
        , add: function() {}
        , remove: function() {}
        , find: function() {}

    }
    scope.json = function (document) {
        document._ = new cJson(document);
        return document;
    }

}

if (window !== undefined) library(window);

exports = function (scope) { library(scope) } ;

