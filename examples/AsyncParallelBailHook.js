// 具有 bail 功能的异步并行钩子
const { AsyncParallelBailHook } = require('../lib');

// 创建实例
const asyncParallelBailHook = new AsyncParallelBailHook(['name', 'age']);


// tapAsync 注册事件
// TODO: 暂时流程没测试很精准
console.time('time1');
asyncParallelBailHook.tapAsync('1', (name, age, done) => {
	setTimeout(() => {
		console.log('1', name, age, new Date());
		done();
	}, 1000);
});

asyncParallelBailHook.tapAsync('2', (name, age, done) => {
	setTimeout(() => {
		console.log('2', name, age, new Date());
		// return 'wrong' // 如果中途返回值 !== undefined，则不执行最后的 done
		done();
		return 1
	}, 2000);
});

asyncParallelBailHook.tapAsync('3', (name, age, done) => {
	setTimeout(() => {
		console.log('3', name, age, new Date());
		done();
		console.timeEnd('time1');
	}, 3000);
});

// 触发事件，让监听函数执行
asyncParallelBailHook.callAsync('panda', 18, err => {
	console.log('complete async:', err);
});
