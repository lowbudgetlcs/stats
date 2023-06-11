const obj = {
    a: 1,
    b: '2',
};

const n = (({ a }) => ({ a }))(obj);

console.log(n);