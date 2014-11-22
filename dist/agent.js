/**
 *File: agent.js
 *Author: Jade
 *Date: 2014.11.20
 */
! function(global, undefined) {

	function calling(fn) {
		return function() {
			return Function.prototype.call.apply(fn, arguments)
		}
	}

	var objProto = Object.prototype
	var arrProto = Array.prototype

	var toStr = calling(objProto.toString)
	var hasOwn = calling(objProto.hasOwnProperty)

	var slice = calling(arrProto.slice)
	var push = calling(arrProto.push)

	function isType(type) {
		return function(obj) {
			return toStr(obj) === '[object ' + type + ']'
		}
	}

	var isObj = isType('Object')
	var isStr = isType('String')
	var isFn = isType('Function')
	var isArr = Array.isArray || isType('Array')

	if (!Function.prototype.bind) {
		Function.prototype.bind = function(context) {
			var that = this
			function Facade() {
				if (this instanceof Facade) {
					that.apply(this, arguments)
				} else {
					return that.apply(context, arguments)
				}
			}
			Facade.prototype = this.prototype
			return Facade
		}
	}

	if (!String.prototype.trim) {
		var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
		String.prototype.trim = function() {
			return this.replace(rtrim, '')
		}
	}


	var _ = {
		keys: Object.keys || function(obj) {

			if (!isObj(obj)) {
				return []
			}

			var keys = []

			for (var key in obj) {
				if (hasOwn(obj, key)) {
					keys.push(key)
				}
			}

			return keys

		},

		values: function(obj) {

			var keys = this.keys(obj)
			var len = keys.length
			var values = new Array(len)

			for (var i = 0; i < len; i += 1) {
				values[i] = obj[keys[i]]
			}

			return values
		},

		invert: function(obj) {
			var ret = {}
			var keys = this.keys(obj)

			for (var i = 0, len = keys.len; i < len; i++) {
				ret[obj[keys[i]]] = keys[i]
			}

			return ret
		}
	}

	function each(obj, fn, context, useForIn) {
		var len = obj.length
		var ret

		if (len === +len && len && !useForIn) {
			for (var i = 0; i < len; i += 1) {
				ret = fn.call(context || global, obj[i], i, obj)
				if (ret !== undefined) {
					return ret
				}
			}
			return obj
		}

		for (var key in obj) {
			if (hasOwn(obj, key)) {
				ret = fn.call(context || global, obj[key], key, obj)
				if (ret !== undefined) {
					return ret
				}
			}
		}

		return obj
	}

	function extend() {
		var target = arguments[0]
		var deep

		if (typeof target === 'boolean') {
			deep = target
			target = arguments[1]
		}

		if (typeof target !== 'object' && !isFn(target)) {
			return target
		}

		var sourceList = slice(arguments, deep ? 2 : 1)

		each(sourceList, function(source) {

			if (typeof source !== 'object') {
				return
			}

			each(source, function(value, key) {

				if (deep && typeof value === 'object') {
					var oldValue = target[key]

					target[key] = typeof oldValue === 'object' ? oldValue : {}

					return extend(deep, target[key], value)
				}

				target[key] = value
			})
		})

		return target

	}

	function isSameType(arr) {
		if (!isArr(arr)) {
			return false
		}
		var len = arr.length
		var type
		var i
		if (len > 1) {
			type = typeof arr[0]
			for (i = len - 1; i >= 0; i--) {
				if (typeof arr[i] !== type) {
					return false
				}
			}
			return true
		}
		return false
	}

	var inherit = Object.create || function(proto) {
		var F = function() {}
		F.prototype = proto
		return new F()
	}

	function invoke(fn, args, context) {
		return fn[isArr(args) ? 'apply' : 'call'](context || global, args);
	}

	function New(constructor) {
		var instance

		if (!isFn(constructor)) {

			instance = typeof constructor === 'object' ? constructor : {}

		} else {

			instance = inherit(constructor.prototype)
			instance = constructor.apply(instance, slice(arguments, 1)) || instance

		}

		return instance
	}


	function mix(source) {
		var instance = mix.instance
		var ret = {}
		var oldValue

		each(source, function(value, prop) {

			var oldValue = instance[prop]
			var retValue

			if (oldValue === undefined) {
				instance[prop] = value
			} else if (isFn(oldValue)) {

				if (isSameType(value)) {
					ret[prop] = []
					each(value, function(v) {
						retValue = invoke(oldValue, v, instance)
						if (retValue !== undefined) {
							ret[prop].push(retValue)
						}
					})
				} else {
					retValue = invoke(oldValue, value, instance)
					if (retValue !== undefined) {
						ret[prop] = retValue
					}
				}

			} else if (typeof oldValue === 'object' && typeof value === 'object') {
				extend(oldValue, value)
			}

		}, global, true)

		return ret
	}


	function createProxy() {
		var instance = New.apply(global, arguments)

		return function(source) {
			if (source === undefined) {
				return instance
			}
			var ret
			mix.instance = instance

			if (isArr(source)) {
				ret = []
				each(source, function(src) {
					if (typeof src === 'object') {
						ret.push(mix(src))
					}
				})
			} else if (typeof source === 'object') {
				ret = mix(source)
			}

			return ret
		}
	}


	if (isFn(global.define)) {

		define(function() {
			return createProxy
		})

	} else if (global.module !== undefined && module.exports) {

		module.exports = createProxy

	} else {

		global.agent = createProxy
		if (global.$$ === undefined) {
			global.$$ = createProxy
		}
	}

}(this);