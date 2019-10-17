// AsyncSeriesHook 钩子的使用
// 异步串行是指，处理函数执行是需要排队的，必须一个一个执行，当前事件处理函数执行完才能执行下一个
const { AsyncSeriesHook } = require('../lib');

// 创建实例
const asyncSeriesHook = new AsyncSeriesHook(['name', 'age']);
const promiseSeriesHook = new AsyncSeriesHook(['name', 'age']);

// tapAsync 注册事件
console.time('time1');
asyncSeriesHook.tapAsync('1', (name, age, next) => {
	setTimeout(() => {
		console.log('1', name, age, new Date());
		next(); // 如果 next 第一个参数返回err，则直接跳过后续所有注册事件
	}, 1000);
});

asyncSeriesHook.tapAsync('2', (name, age, next) => {
	setTimeout(() => {
		console.log('2', name, age, new Date());
		next();
	}, 2000);
});

asyncSeriesHook.tapAsync('3', (name, age, next) => {
	setTimeout(() => {
		console.log('3', name, age, new Date());
		next();
		console.timeEnd('time1');
	}, 3000);
});

// 触发事件，让监听函数执行
asyncSeriesHook.callAsync('panda', 18, err => {
	// 同 AsyncParallelHook 这里只有 err 参数，没有回调参数 res
	console.log('complete async:', err);
});

// 1 panda 18 2019-10-17T03:33:24.375Z
// 2 panda 18 2019-10-17T03:33:26.381Z
// 3 panda 18 2019-10-17T03:33:29.385Z
// complete async: undefined undefined
// time1: 6013.080ms



// tapPromise 注册事件
console.time('time2');
promiseSeriesHook.tapPromise('21', (name, age) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			console.log('21', name, age, new Date());
			resolve('21');
		}, 1000);
	});
});

promiseSeriesHook.tapPromise('22', (name, age) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			console.log('22', name, age, new Date());
			// resolve('22');
		}, 2000);
	});
});

promiseSeriesHook.tapPromise('23', (name, age) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			console.log('23', name, age, new Date());
			resolve('23');
			console.timeEnd('time2');
		}, 3000);
	});
});

// 触发事件，让监听函数执行
promiseSeriesHook.promise('panda', 18).then(res => {
	console.log('complete promise:', res);
});

// 同 AsyncParallelHook 一样，如果同时使用 tapAsync 和 tapPromise 注册事件，触发时会触发所有的注册过的事件
// 同样没有回调参数

// 1 panda 18 2019-10-17T03:27:02.523Z
// 21 panda 18 2019-10-17T03:27:02.526Z
// 2 panda 18 2019-10-17T03:27:04.530Z
// 22 panda 18 2019-10-17T03:27:04.531Z
// 3 panda 18 2019-10-17T03:27:07.536Z
// complete async: undefined undefined
// time1: 6018.301ms
// 23 panda 18 2019-10-17T03:27:07.536Z
// time2: 6016.866ms
// complete promise: undefined

class MockAsyncSeriesHook {
	constructor(args) {
		this.args = args;
		this.tasks = [];
	}

	tabAsync(name, task) {
		this.tasks.push(task);
	}
	callAsync(...args) {
		// 先取出最后传入的回调函数
		const finalCallback = args.pop();

		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 定义一个 i 变量和 next 函数，每次取出一个事件处理函数执行，并维护 i 的值
		// 直到所有事件处理函数都执行完，调用 callAsync 的回调
		// 如果事件处理函数中没有调用 next，则无法继续
		let i = 0;
		const next = () => {
			const task = this.tasks[i++];
			task ? task(...args, next) : finalCallback();
		};
		next();
	}

	tapPromise(name, task) {
		this.tasks.push(task);
	}
	promise(...args) {
		// 传入参数严格对应创建实例传入数组中的规定的参数，执行时多余的参数为 undefined
		args = args.slice(0, this.args.length);

		// 将每个事件处理函数执行并调用返回 Promise 实例的 then 方法
		// 让下一个事件处理函数在 then 方法成功的回调中执行
		const [first, ...others] = this.tasks;
		return others.reduce((promise, task) => {
			return promise.then(() => task(...args));
		}, first(...args));
	}
}


/**


// tapAsync compile 输出

series 串行输出:

// series 串行输出开始
function _next1() {
	var _fn2 = _x[2];
	_fn2(name, age, _err2 => {
		if (_err2) {
			_callback(_err2);
		} else {
			_callback();
		}
	});
}
function _next0() {
	var _fn1 = _x[1];
	_fn1(name, age, _err1 => {
		if (_err1) {
			_callback(_err1);
		} else {
			_next1();
		}
	});
}
var _fn0 = _x[0];
_fn0(name, age, _err0 => {
	if (_err0) {
		_callback(_err0);
	} else {
		_next0();
	}
});

// series 串行输出结束



// tapPromise compile 输出

series 串行输出:

// series 串行输出开始
function _next1() {
	var _fn2 = _x[2];
	var _hasResult2 = false;
	var _promise2 = _fn2(name, age);
	if (!_promise2 || !_promise2.then)
		throw new Error(
			"Tap function (tapPromise) did not return promise (returned " +
				_promise2 +
				")"
		);
	_promise2.then(
		_result2 => {
			_hasResult2 = true;
			_resolve();
		},
		_err2 => {
			if (_hasResult2) throw _err2;
			_error(_err2);
		}
	);
}
function _next0() {
	var _fn1 = _x[1];
	var _hasResult1 = false;
	var _promise1 = _fn1(name, age);
	if (!_promise1 || !_promise1.then)
		throw new Error(
			"Tap function (tapPromise) did not return promise (returned " +
				_promise1 +
				")"
		);
	_promise1.then(
		_result1 => {
			_hasResult1 = true;
			_next1();
		},
		_err1 => {
			if (_hasResult1) throw _err1;
			_error(_err1);
		}
	);
}
var _fn0 = _x[0];
var _hasResult0 = false;
var _promise0 = _fn0(name, age);
if (!_promise0 || !_promise0.then)
	throw new Error(
		"Tap function (tapPromise) did not return promise (returned " +
			_promise0 +
			")"
	);
_promise0.then(
	_result0 => {
		_hasResult0 = true;
		_next0();
	},
	_err0 => {
		if (_hasResult0) throw _err0;
		_error(_err0);
	}
);

// series 串行输出结束

*/
