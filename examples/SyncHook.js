// SyncHook 钩子的使用
// 为串行同步执行，不关心事件处理函数的返回值，在触发事件之后，会按照事件注册的先后顺序执行所有的事件处理函数。
const { SyncHook } = require("../lib");

// 创建实例，支持传入一个数组，数组内存储事件触发时传入的参数
let syncHook = new SyncHook(["name", "age"]);

// 注册事件
// 第一个参数为事件名称（Webpack 中是插件名称，起到注释作用）
// 第二个参数为事件处理函数，函数参数为执行 `call` 方法触发事件时所传入的参数的形参
syncHook.tap("1", (name, age) => console.log("1", name, age));
syncHook.tap("2", (name, age) => console.log("2", name, age));
syncHook.tap("3", (name, age) => console.log("3", name, age));

// 触发事件，让监听函数执行
syncHook.call("panda", 18);

// 1 panda 18
// 2 panda 18
// 3 panda 18



// 模拟 SyncHook 类
class MockSyncHook {
	constructor(args) {
		this.args = args;
		this.tasks = [];
	}
	// 订阅
	tap(name, task) {
		this.tasks.push(task);
	}
	// 发布
	call(...args) {
		// 也可在参数不足时抛出异常
		if (args.length < this.args.length) throw new Error('参数不足');

		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 依次执行事件处理函数
		this.tasks.forEach(task => task(...args));
	}
}


/**

// compile 输出

// series 串行输出开始
var _fn0 = _x[0];
_fn0(name, age);
var _fn1 = _x[1];
_fn1(name, age);
var _fn2 = _x[2];
_fn2(name, age);

// series 串行输出结束

*/
