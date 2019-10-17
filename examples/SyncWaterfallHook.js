// SyncWaterfallHook 钩子的使用
// 为串行同步执行，将上一个事件处理函数的返回值作为参数传递给下一个事件处理函数，依次类推
// 只有第一个事件处理函数的参数可以通过 `call` 传递，而 `call` 的返回值为最后一个事件处理函数的返回值。
const { SyncWaterfallHook } = require("../lib");

// 创建实例
let syncWaterfallHook = new SyncWaterfallHook(["name", "age"]);

// 注册事件
syncWaterfallHook.tap("1", (name, age) => {
	console.log("1", name, age);
	return "1";
});

// 如果当前事件函数返回值 === undefined，则下一个事件函数会接收上一个的返回值，也就是会穿透过去
syncWaterfallHook.tap("2", data => {
	console.log("2", data);
	// return "2";
});

syncWaterfallHook.tap("3", data => {
	console.log("3", data);
	return "3"
});

// 触发事件，让监听函数执行
let ret = syncWaterfallHook.call("panda", 18);
console.log("call", ret);

// 1 panda 18
// 2 1
// 3 2
// call 3



// SyncWaterfallHook 名称中含有 “瀑布”，通过上面代码可以看出 “瀑布” 形象生动的描绘了事件处理函数执行的特点，
// 与 SyncHook 和 SyncBailHook 的区别就在于事件处理函数返回结果的流动性

// 模拟 SyncWaterfallHook 类
class MockSyncWaterfallHook {
	constructor(args) {
		this.args = args;
		this.tasks = [];
	}
	tap(name, task) {
		this.tasks.push(task);
	}
	call(...args) {
		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 依次执行事件处理函数，事件处理函数的返回值作为下一个事件处理函数的参数
		let [first, ...others] = this.tasks;
		return others.reduce((ret, task) => task(ret), first(...args));
	}
}

// 实现自定义 reduce 方法，中间函数无返回值的，支持穿透

// 上面代码中 `call` 的逻辑是将存储事件处理函数的 `tasks` 拆成两部分，分别为第一个事件处理函数，和存储其余事件处理函数的数组，
// 使用 `reduce` 进行归并，将第一个事件处理函数执行后的返回值作为归并的初始值，依次调用其余事件处理函数并传递上一次归并的返回值。


/**

// compile 输出

// series 串行输出开始
var _fn0 = _x[0];
var _result0 = _fn0(name, age);
if (_result0 !== undefined) {
	name = _result0;
}
var _fn1 = _x[1];
var _result1 = _fn1(name, age);
if (_result1 !== undefined) {
	name = _result1;
}
var _fn2 = _x[2];
var _result2 = _fn2(name, age);
if (_result2 !== undefined) {
	name = _result2;
}
return name;

// series 串行输出结束

*/
