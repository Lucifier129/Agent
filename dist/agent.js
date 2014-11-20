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

	function agent(constructor) {

		var instance

		if (constructor === undefined || !isFn(constructor)) {

			instance = isObj(constructor) ? constructor : {}

		} else {

			instance = inherit(constructor.prototype)
			instance = constructor.apply(instance, Array.prototype.slice.call(arguments, 1)) || instance

		}

		return function(options) {

			if (!isObj(options)) {
				return instance
			}

			var oldValue
			var newValue
			for (var prop in options) {

				if (!options.hasOwnProperty(prop)) {
					continue
				}

				newValue = options[prop]
				oldValue = instance[prop]

				if (isFn(oldValue)) {

					oldValue.apply(instance, isArr(newValue) ? newValue : [newValue])

				} else {

					instance[prop] = newValue

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