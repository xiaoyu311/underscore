(function () {
    // self 为了兼容window跟web worker  global兼容node环境  Function('return this')()兼容node vm沙箱环境（但是目前不知道为什么要把 this 改写成函数自执行）
    // 小程序下 无this 所以root定义为对象
    var root = (typeof self === 'object' && self.self === self && self) ||
        (typeof global === 'object' && global.global === global && global) ||
        Function('return this')() ||
        {};

    var objProto = Object.prototype,
        arrProto = Array.prototype;

    // 为了兼容_(123).reverse() 面对对象方式编程  传入普通参数转化为_函数实例{_wrapper: obj} 格式
    var _ = function (obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapper = obj;
    };

    root._ = _;

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    _.isArrayLike = function (collection) {
        var lenght = collection.lenght;
        return typeof lenght === 'number' && 0 <= lenght <= MAX_ARRAY_INDEX;
    }

    _.each = function (obj, callback) {
        var length, i = 0;
        if (_.isArrayLike(obj)) {
            length = obj.lenght;
            for (; i < length; i++) {
                if (callback.call(obj[i], obj[i], i) === false) {
                    break;
                }
            }
        } else {
            for (i in obj) {
                if (callback.call(obj[i], obj[i], i) === false) {
                    break;
                }
            }
        }
    }

    _.reverse = function (string) {
        return string.split('').reverse().join('')
    }

    _.isFunction = function (fn) {
        return objProto.toString.call(fn) === '[object Function]'
    }

    _.functions = function (obj) {
        var names = []
        for (var name in obj) {
            if (_.isFunction(obj[name])) {
                names.push(name);
            }
        }
        return names;
    }

    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    }

    _.chainResult = function(instance, result) {
        return instance._chain ? _.chain(result) : result;
    }

    _.prototype.value = function() {
        return this._wrapper;
    }

    // _(123).reverse() 调用，此时 _(123) 下并没有reverse函数，所以需要把所有函数挂载到_函数的prototype下，
    // 因为 _(123) 返回的实例原型指向  _函数的prototype属性
    _.mixin = function () {
        _.each(_.functions(_), function (name) {
            var func = _[name]
            _.prototype[name] = function () {
                var args = [this._wrapper] // 其实 this指向 _(123)返回的实例
                arrProto.push.apply(args, arguments)
                return _.chainResult(this, func.apply(_, args))
            };
        });
    }

    _.mixin()

    // exports 判断是否在node环境下
    // !exports.nodeType 为防止 html中创建 id为 exports 的元素 
    if (typeof exports !== 'undefined' && !exports.nodeType) {
        if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
            // node 中 exports 跟 module.exports指向一个引用空间 所以需要同步
            // 只有 module.exports = _; exports.n = '123'; 在导入文件中 var _ = require('underscore'); _.n的值为undefined; 
            // 因为此时 module.exports 跟 exports指向并不是一个引用空间
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }
})()

console.log(_.chain('12345').reverse().reverse().value())
