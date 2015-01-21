/**
 * extract.js
 * @author:Jade Gu
 * @date:2015.01.21
 */
;
(function(global, undefined) {
	//base
	function calling(fn) {
		return function() {
			return Function.prototype.call.apply(fn, arguments)
		}
	}

	var objProto = Object.prototype
	var toStr = calling(objProto.toString)
	var hasOwn = calling(objProto.hasOwnProperty)
	var slice = calling(Array.prototype.slice)

	function isType(type) {
		return function(obj) {
			return obj == null ? obj : toStr(obj) === '[object ' + type + ']'
		}
	}

	var isObj = isType('Object')
	var isStr = isType('String')
	var isFn = isType('Function')
	var isArr = Array.isArray || isType('Array')

	if (!String.prototype.trim) {
		var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
		String.prototype.trim = function() {
			return this.replace(rtrim, '')
		}
	}

	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(value) {
			for (var i = this.length - 1; i >= 0; i--) {
				if (this[i] === value) {
					return i
				}
			}
			return -1
		}
	}

	var _ = {
		keys: Object.keys || function(obj) {
			var keys = []
			if (!isObj(obj)) {
				return keys
			}
			for (var key in obj) {
				if (hasOwn(obj, key)) {
					keys.push(key)
				}
			}
			return keys
		},
		parse: function(descri) {
			var ret = {}
			if (!isStr(descri)) {
				return ret
			}
			var group = descri.trim().split(';')
			each(group, function(value) {
				value = value.trim().split(':')
				if (value.length < 2) {
					return
				}
				var aliasName = value[1].trim()
				var methodName = value[0].trim()
				var arr = ret[aliasName] = ret[aliasName] || []
				if (arr.indexOf(methodName) === -1) {
					arr.push(methodName)
				}
			})
			return ret
		}
	}

	function each(obj, fn, context) {
		if (obj == undefined || !isFn(fn)) {
			return obj
		}
		var len = obj.length
		var i = 0
		var ret

		if (len === +len && len > 0) {
			for (; i < len; i += 1) {
				ret = fn.call(context || global, obj[i], i)
				if (ret !== undefined) {
					return ret
				}
			}
			return obj
		}
		var keys = _.keys(obj)
		var key
		len = keys.length
		for (; i < len; i += 1) {
			key = keys[i]
			ret = fn.call(context || global, obj[key], key)
			if (ret !== undefined) {
				return ret
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

	function parsePropChain(propChain) {
		return isArr(propChain) ? propChain : isStr(propChain) ? propChain.trim().split('.') : []
	}


	objProto.get = function(propChain, callback) {
		var props = parsePropChain(propChain)
		var result = this
		var hasCallback = isFn(callback)
		each(props, function(prop) {
			if (hasCallback) {
				callback(result, prop)
			}
			result = result[prop]
			if (result == null) {
				return result
			}
		})
		return result
	}

	objProto.getGlobal = function() {
		return global
	}

	objProto.set = function(propChain, val) {
		var props = parsePropChain(propChain)
		var len = props.length
		if (len === 1) {
			this[props[0]] = val
		} else if (len > 1) {
			var obj = this.get(props.slice(0, len - 1), function(currentObj, currentProp) {
				if (currentObj[currentProp] == null) {
					currentObj[currentProp] = {}
				}
			})
			obj[props[len - 1]] = val
		}
	}

	objProto.invoke = function(propChain) {
		var props = parsePropChain(propChain)
		var len = props.length
		var method = this.get(props)
		if (!isFn(method)) {
			return
		}
		if (len === 1) {
			obj = this
		} else if (len > 1) {
			obj = this.get(props.slice(0, len - 1))
		}
		return method.apply(obj, slice(arguments, 1))
	}

	objProto.extend = function() {
		var args = slice(arguments)
		var len = args.length
		var index = 0
		var propChain = args[index]
		if (typeof propChain === 'boolean') {
			index = 1
			propChain = args[1]
		}

		if (!isStr(propChain) && !isArr(propChain)) {
			if (isObj(propChain)) {
				args.splice(index, 0, this)
			} else {
				return
			}
		} else {
			var target = this.get(propChain)
			args.splice(index, 1, target)
		}

		extend.apply(global, args)

		return this
	}

	objProto.mapping = function() {
		//to do
	}

}(this));