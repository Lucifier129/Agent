/**
 *File: agent.js
 *Author: Jade
 *Date: 2014.11.20
 */
! function(global, undefined) {

	function isType(type) {
		return function(obj) {
			return Object.prototype.toString.call(obj) === '[object ' + type + ']'
		}
	}

	var isObj = isType('Object')
	var isFn = isType('Function')
	var isArr = Array.isArray || isType('Array')


	var inherit = Object.create ? function(proto) {
		return Object.create(proto)
	} : function(proto) {
		var F = function() {}
		F.prototype = proto
		return new F()
	}

	var _instance

	function invoke(options) {
		var instance = _instance
		var newValue
		var oldValue
		var value
		var prop
		var type
		var key
		var len
		var i

		for (prop in options) {

			if (!options.hasOwnProperty(prop)) {
				continue
			}

			newValue = options[prop]
			oldValue = instance[prop]

			if (isFn(oldValue)) {

				if (isArr(newValue)) {
					len = newValue.length

					if (len > 1) {
						type = typeof newValue[0]

						for (i = len - 1; i >= 1; i--) {
							if (typeof newValue[i] !== type) {
								type = false
								break
							}
						}

						if (type) {
							for (i = 0; i < len; i += 1) {
								value = newValue[i]
								oldValue[isArr(value) ? 'apply' : 'call'](instance, value)
							}
							continue
						}
					}

					oldValue.apply(instance, newValue)

				} else {
					instance[prop](newValue)
				}

			} else {

				if (typeof newValue === 'object' && typeof oldValue === 'object') {

					for (key in newValue) {
						oldValue[key] = newValue[key]
					}

				} else {
					instance[prop] = newValue
				}

			}
		}
	}

	function agent(constructor) {

		var instance

		if (constructor === undefined || !isFn(constructor)) {

			instance = typeof constructor === 'object' ? constructor : {}

		} else {

			instance = inherit(constructor.prototype)
			instance = constructor.apply(instance, Array.prototype.slice.call(arguments, 1)) || instance

		}

		return function facade(options) {
			_instance = instance
			if (isObj(options)) {
				invoke(options)
			} else if (isArr(options)) {
				for (var i = 0, len = options.length; i < len; i += 1) {
					invoke(options[i])
				}
			}

			return instance
		}

	}

	if (isFn(global.define)) {

		define(function() {
			return agent
		})

	} else if (global.module !== undefined && module.exports) {

		module.exports = agent

	} else {

		global.agent = agent
		if (global.$$ === undefined) {
			global.$$ = agent
		}
	}

}(this);