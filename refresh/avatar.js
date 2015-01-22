/**
 * avatar.js
 * @author:Jade Gu
 * @date:2015.01.21
 */
;(function(global, undefined) {
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

	if (!Object.defineProperty && Object.prototype.__defineSetter__) {
		Object.defineProperty = function(obj, propName, descriptor) {
			obj.__defineGetter__(propName, descriptor.get)
			obj.__defineSetter__(propName, descriptor.set)
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
				var avatarPropChain = value[1].trim()
				var selfPropChain = value[0].trim()
				if (avatarPropChain && selfPropChain) {
					ret[selfPropChain] = avatarPropChain
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


	objProto.separator = '.'

	function parsePropChain(propChain, separator) {
		return isArr(propChain) ? propChain : isStr(propChain) ? propChain.trim().split(separator || '.') : []
	}

	objProto.chain = function(propChain, callback) {
		var props = parsePropChain(propChain, this.separator)
		var result = this
		var hasCallback = isFn(callback)
		var count = 0
		each(props, function(prop) {
			if (hasCallback) {
				callback(result, prop, props.slice(0, ++count))
			}
			result = result[prop]
			if (result == null) {
				return result
			}
		})
		return result
	}

	objProto.scan = function(propChainObj) {
		var that = this
		var result
		if (isStr(propChainObj)) {
			return that.chain(propChainObj)
		} else if (isArr(propChainObj)) {
			result = []
		} else if (isObj(propChainObj)) {
			result = {}
		}
		each(propChainObj, function(propChain, key) {
			result[key] = that.chain(propChain)
		})
		return result
	}

	objProto.build = function(propChain, val) {
		var props = parsePropChain(propChain, this.separator)
		var len = props.length
		if (len === 1) {
			this[props[0]] = val
		} else if (len > 1) {
			var obj = this.chain(props.slice(0, len - 1), function(currentObj, currentProp) {
				if (currentObj[currentProp] == null) {
					currentObj[currentProp] = {}
				}
			})
			obj[props[len - 1]] = val
		}
	}

	objProto.invoke = function(propChain) {
		var props = parsePropChain(propChain, this.separator)
		var len = props.length
		var method = this.chain(props)
		if (!isFn(method)) {
			return
		}
		if (len === 1) {
			obj = this
		} else if (len > 1) {
			obj = this.chain(props.slice(0, len - 1))
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
			var target = this.chain(propChain)
			args.splice(index, 1, target)
		}

		extend.apply(global, args)

		return this
	}

	objProto.mapping = function(avatar, descriptor) {
		if (!isObj(descriptor)) {
			return
		}
		var that = this
		each(descriptor, function(avatarPropChain, selfPropChain) {
			var props = parsePropChain(avatarPropChain, avatar.separator)
			var len = props.length
			var target = avatar.chain(props.slice(0, len - 1))
			var propName = props[len - 1]
			var val = target[propName]
			var __events__ = target['__events__']

			that.build(selfPropChain, val)

			if (!__events__) {
				__events__ = target['__events__'] = {}
			}

			if (!__events__[propName]) {
				__events__[propName] = []
				Object.defineProperty(target, propName, {
					get: function() {
						return val
					},
					set: function(v) {
						each(__events__[propName], function(callback) {
							callback(v)
						})
						val = v
					}
				})
			}

			__events__[propName].push(function(v) {
				that.build(selfPropChain, v)
			})
		})
		return avatar
	}


	var elemProto = Element.prototype

	elemProto.directiveName = 'js'

	elemProto.getElementsByDirective = function(directiveName) {
		return this.querySelectorAll('[' + (directiveName || this.directiveName) + ']') || []
	}

	elemProto.getDirective = function(directiveName) {
		return _.parse(this.getAttribute(directiveName || this.directiveName))
	}

	elemProto.setDirective = function(descriptor, directiveName) {
		this.setAttribute(directiveName || this.directiveName, descriptor)
		return this
	}

	elemProto.mappingAll = function(avatar) {
		var elems = this.getElementsByDirective()
		each(elems, function(elem) {
			elem.mapping(avatar, elem.getDirective())
		})
		return avatar
	}

	elemProto.setDirectiveAll = function(descriptorObj) {
		var that = this
		each(descriptorObj, function(descriptor, selector) {
			var elems = that.querySelectorAll(selector)
			if (isObj(descriptor)) {
				var _descriptor = ''
				each(descriptor, function(avatarPropChain, selfPropChain) {
					_descriptor += selfPropChain + ':' + avatarPropChain + ';'
				})
				descriptor = _descriptor
			}
			each(elems.length ? elems : [], function(elem) {
				elem.setDirective(descriptor)
			})
		})
		return this
	}

}(this));