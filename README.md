Agent
=====

代理模式：将函数调用转化为配置模式

#关于Agent

`Agent` 是专门针对构造函数或单例的代理模式包装策略。它根据传入的构造函数与初始化参数，得到其实例`instance`，并返回一个代理函数。

该接受一个对象`options`作为参数，针对`options`对象的每一个属性`prop`， 代理函数的处理规则如下：

> 1、如果`instance[prop]`不是一个函数，则有`instance[prop] = options[prop]`
> 2、如果`instance[prop]`是一个函数，则有`instance[prop].apply(instance, isArray(options[prop]) ? options[prop] : [options[prop]])`

了解`javascript`中的原型继承的人都知道，`instance[prop]`可以是原型对象中的方法


#API介绍

`Anget`支持amd与cmd以及commonJs模块规范，如果三者都无，则作为全局变量`agent`。

如果`window.$$`为`undefined`，`Angent`将赋值给它，占用两个全局变量

`test.html`中包含了`Agnet`的大多数用法，如下：

```javascript
 (function() {


        //test jQuery
        //$$ 或 agent 返回代理函数
        //第一个参数为构造函数或单例对象
        //第二或之后的参数，为构造函数的参数
        //如要代理 $('.item')，形式如下

        var $item = $$($, '.item')

        //下面这种形式也可以，上面为快捷方式
/*        var $item = $('.item')
        $item = $$($item)*/


        var items_settings = {

            text: '测试代理jQuery实例，调用text、css以及animate方法',

            css: ['color', '#f00'],

            animate: {
                'line-height': '300px'
            }

        }

        $item(items_settings)


        //test seajs

        //seajs 是单例，可以直接用代理函数覆盖它

        seajs = $$(seajs)

        var seajs_settings = {
            //相当于调用 seajs.config()
            config: {
                alias: {
                    'test': './test-seajs'
                }
            },
            //相当于调用 seajs.use
            use: ['test', function(data) {

                setTimeout(function() {
                    $item({
                        text: data
                    })
                }, 1000)

            }]
        }

        seajs(seajs_settings)

        //可以通过以下方式返回 agent 所代理的实例对象
/*        console.log(seajs)
        seajs = seajs()
        console.log(seajs)*/

        //test 自定义构造函数

        function Person(name, age) {
            this.name = name
            this.age = age
        }

        Person.prototype = {
            say: function(words) {

                console.log(words || this.name)
            },
            sing: function(song) {
                console.log('singing ' + song)
            },
            grow: function(age) {
                this.age = age || this.age
                console.log('My age now is ' + this.age)
            }
        }

        var person = $$(Person, 'Jade', '24')

        person({

            say: '我不会被say，因为下面有个say覆盖了我',

            sing: '月亮代表我的心',

            grow: 25,

            //添加新属性
            job: 'FE',

            //添加新方法
            jump: function(high) {
                console.log('跳了' + high + '米')
            },

            //如果现有的或原型上的属性为函数，不会覆盖
            //只会调用，并将新的值作为参数传入
            say: function() {
                'say函数已经存在，我将被作为参数传入，在控制台被输出'
            }
        })

        //不管传参与否，代理函数每次都返回其所带里的实例
        //随时可以通过赋值，找回实例，并按照以前的风格使用
        console.log(person())

        //直接看不到100行的源码，是了解 agent 的最佳途径


    }())
```
