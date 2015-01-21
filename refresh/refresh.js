/**
 * refresh.js
 * @author:Jade Gu
 * @date:2015.01.14
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

	var elemProto = Element.prototype

	elemProto.directiveOption = {
		name: 'js'
	}

	elemProto.setDirectiveOption = function(option) {
		if (!this.hasOwnProperty('directiveOption')) {
			this.directiveOption = {}
		}
		extend(true, this.directiveOption, elemProto.directiveOption, option)
		if (isObj(this.directiveOption.config)) {
			var that = this
			each(this.directiveOption.config, function(directiveObj, selector) {
				var elems

				if (/\#/.test(selector)) {
					elems = document.querySelectorAll(selector)
				} else {
					elems = that.querySelectorAll(selector)
				}

				var directives = ''
				if (isObj(directiveObj)) {
					each(directiveObj, function(alias, propname) {
						directives += propname + ':' + alias + ';'
					})
				} else if (isStr(directiveObj)) {
					directives = directiveObj
				}

				if (!directives) {
					return
				}
				each(elems, function(elem) {
					elem.setDirective(directives)
				})
			})
		}
		return this
	}

	elemProto.getDirective = function() {
		return this.getAttribute(this.directiveOption.name)
	}

	elemProto.setDirective = function(value) {
		return this.setAttribute(this.directiveOption.name, value)
	}

	elemProto.parseDirectiveValue = function(directiveValue) {
		directiveValue = directiveValue || this.getDirective()
		return isStr(directiveValue) ? _.parse(directiveValue) : {}
	}

	elemProto.getElementsByDirective = function() {
		return this.querySelectorAll('[' + this.directiveOption.name + ']')
	}

	function getFnByStr(obj, str) {
		str = isArr(str) ? str : str.trim().split('.')
		var prevObj
		var prop
		each(str, function(key) {
			prop = key
			prevObj = obj
			obj = obj[prop]
		})

		return isFn(obj) ? function() {
			return obj.apply(prevObj, slice(arguments))
		} : function(val) {
			if (typeof prevObj[prop] === 'object' && typeof val === 'object') {
				extend(true, prevObj[prop], val)
			} else {
				prevObj[prop] = val
			}
		}
	}

	function createObjByStr(str) {
		str = isArr(str) ? str : str.trim().split('.')
		var obj = {}
		var ret = obj
		for (var i = 0, len = str.length; i < len; i += 1) {
			obj = obj[str[i]] = {}
		}
		return ret
	}

	function getValueByStr(obj, str, elem) {
		str = isArr(str) ? str : str.trim().split('.')
		var prop
		var prevObj
		each(str, function(key) {
			prop = key
			prevObj = obj
			obj = obj[prop]
			if (obj == undefined) {
				return false
			}
		})
		if (obj && isObj(prevObj)) {
			Object.defineProperty(prevObj, prop, {
				get: function() {
					return obj
				},
				set: function(v) {
					var newObj = createObjByStr(str)
					var method = getFnByStr(newObj, str)
					method(obj = v)
					elem.startUpDirective(newObj)
				}
			})
		}
		return obj
	}

	elemProto.startUpDirective = function(data) {
		if (!isObj(data)) {
			return
		}
		var vm = this.parseDirectiveValue()
		var that = this
		each(vm, function(methods, alias) {
			var value = getValueByStr(data, alias, that)
			if (value === undefined) {
				return
			}
			each(methods, function(methodname) {
				methodname = methodname.split('-')
				var args = methodname.slice(1)
				var method = getFnByStr(that, methodname[0])
				method.apply(global, args.concat(value))
			})
		})
		return this
	}

	elemProto.startUpDirectiveAll = function(data) {
		this.startUpDirective(data)
		var elems = this.getElementsByDirective()
		each(elems, function(elem) {
			elem.startUpDirective(data)
		})
		return this
	}

}(this));