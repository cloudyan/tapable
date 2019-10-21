// SyncBailHook 钩子的使用
// 为串行同步执行，如果事件处理函数执行时返回值为 `undefined`（即返回值 === undefined），
// 则继续执行后面的事件处理函数，否则跳过（如类的名字，意义在于保险）。
// 通俗讲，就是只要碰到一个 task 有返回值(!== undefined)就终止后续所有 task 任务
const { SyncBailHook } = require("../lib");

// 创建实例
let syncBailHook = new SyncBailHook(["name", "age"]);

// 注册事件
syncBailHook.tap("1", (name, age) => console.log("1", name, age));

syncBailHook.tap("2", (name, age) => {
	console.log("2", name, age);
	return 0;
});

syncBailHook.tap("3", (name, age) => console.log("3", name, age));

// 触发事件，让监听函数执行
syncBailHook.call("panda", 18);

// 1 panda 18
// 2 panda 18



// 模拟 SyncBailHook 类
class MockSyncBailHook {
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

		// 依次执行事件处理函数，如果有返回值则立即停止循环，即实现“保险”的功能
		// let i = 0, ret;
		// do {
		// 	ret = this.tasks[i++](...args);
		// } while (ret === undefined && i < this.tasks.length);

		// or
		for(let j = 0; j < this.tasks.length; j++) {
			const task = this.tasks[j]
			const result = task(...args)
			if (result !== undefined) break
		}
	}
}


/**

// compile 输出

// series 串行输出开始
var _fn0 = _x[0];
var _result0 = _fn0(name, age);
if (_result0 !== undefined) {
	return _result0;
} else {
	var _fn1 = _x[1];
	var _result1 = _fn1(name, age);
	if (_result1 !== undefined) {
		return _result1;
	} else {
		var _fn2 = _x[2];
		var _result2 = _fn2(name, age);
		if (_result2 !== undefined) {
			return _result2;
		} else {
		}
	}
}

// series 串行输出结束

*/
