var Seq = require('seq');

exports.seq = function (assert) {
    var to = setTimeout(function () {
        assert.fail('never got to the end of the chain');
    }, 50);
    var calls = 0;
    
    Seq(1)
        .seq(function (n) {
            assert.equal(n, 1);
            var seq = this;
            setTimeout(function () { seq(null, 2) }, 25);
            assert.eql(this.stack, [n]);
            calls++;
        })
        .seq(function (n) {
            assert.equal(n, 2);
            assert.eql(this.stack, [n]);
            
            calls++;
            assert.equal(calls, 2);
            clearTimeout(to);
        })
    ;
};

exports.catchSeq = function (assert) {
    var to = setTimeout(function () {
        assert.fail('never caught the error');
    }, 50);
    
    var tf = setTimeout(function () {
        assert.fail('final action never executed');
    }, 50);
    
    var calls = {};
    Seq(1)
        .seq(function (n) {
            assert.equal(n, 1);
            calls.before = true;
            this('pow!');
            calls.after = true;
        })
        .seq(function (n) {
            assert.equal(n, 2);
            calls.next = true;
        })
        .catch(function (err) {
            assert.equal(err, 'pow!');
            assert.ok(calls.before);
            assert.ok(!calls.after);
            assert.ok(!calls.next);
            clearTimeout(to);
        })
        .do(function () {
            assert.ok(calls.after);
            clearTimeout(tf);
        })
    ;
};

exports.par = function (assert) {
    var to = setTimeout(function () {
        assert.fail('seq never fired');
    }, 75);
    
    Seq()
        .par(function () {
            var seq = this;
            setTimeout(function () { seq(null, 'x') }, 50);
        })
        .par(function () {
            var seq = this;
            setTimeout(function () { seq(null, 'y') }, 25);
        })
        .par('z', function () {
            this(null, 42);
        })
        .seq(function (x, y) {
            clearTimeout(to);
            assert.equal(x, 'x');
            assert.equal(y, 'y');
            assert.eql(this.args, { 0 : ['x'], 1 : ['y'], z : [42] });
            assert.eql(this.stack, [ 'x', 'y' ]);
            assert.eql(this.vars, { z : 42 });
        })
    ;
};

exports.catchPar = function (assert) {
    var done = false, caught = false;
    var tc = setTimeout(function () {
        assert.fail('error not caught');
    }, 75);
    
    Seq()
        .par('one', function () {
            setTimeout(this.bind({}, 'rawr'), 25);
        })
        .par('two', function () {
            setTimeout(this.bind({}, null, 'y'), 50);
        })
        .seq(function (x, y) {
            assert.fail('seq fired with error above');
        })
        .catch(function (err, key) {
            clearTimeout(tc);
            assert.equal(err, 'rawr');
            assert.equal(key, 'one');
        })
    ;
};

exports.forEach = function (assert) {
    var to = setTimeout(function () {
        assert.fail('seq never fired after forEach');
    }, 25);
    
    var count = 0;
    Seq(1,2,3)
        .par(function () {
            this(null, 4);
        })
        .forEach(function (x, i) {
            assert.equal(x - 1, i);
            count ++;
        })
        .seq(function () {
            clearTimeout(to);
            assert.equal(count, 4);
        })
    ;
};

/*
exports.seqEach = function (assert) {
    var count = 0, done = false;
    Seq(1,2,3)
        .seqEach(function (x, i, seq) {
            assert.equal(seq, this);
            assert.equal(x - 1, i);
            count ++;
            this(null, x * 10);
        })
        .seq(function (xs) {
            assert.equal(count, 3);
            assert.deepEqual(xs, [10,20,30]);
            done = true;
        })
    ;
    setTimeout(function () {
        assert.ok(done);
    }, 25);
};

/*
exports.seqEachCatch = function (assert) {
    var count = 0, done = false;
    var caught = [], values = [];
    Seq([1,2,3,4])
        .seqEach(function (x, i, seq) {
            values.push([i,x]);
            assert.equal(seq, this);
            assert.equal(x - 1, i);
            count ++;
            if (i >= 2) this('meow ' + i)
            else this(null, x * 10);
        })
        .seq(function (xs) {
            done = true;
        })
        .catch(function (err) {
            caught.push(err);
        })
    ;
    setTimeout(function () {
        assert.ok(!done);
        assert.equal(count, 3);
        assert.deepEqual(caught, [ 'meow 2' ]);
        assert.deepEqual(values, [[0,1],[1,2],[2,3]]);
    }, 25);
};

exports.parEach = function (assert) {
    var values = [];
    var done = false;
    Seq([1,2,3,4])
        .parEach(function (x, i, par) {
            assert.equal(this, par);
            values.push([i,x]);
            setTimeout(par().bind({}, null, x * 10), 50);
        })
        .seq(function (xs) {
            assert.deepEqual(xs, [10,20,30,40])
            done = true;
        })
    ;
    setTimeout(function () {
        assert.deepEqual(values, [[0,1],[1,2],[2,3],[3,4]]);
        assert.ok(done);
    }, 100);
};

exports.parEachCatch = function (assert) {
    var values = [];
    var done = false;
    var errors = [];
    Seq([1,2,3,4])
        .parEach(function (x, i, par) {
            assert.equal(this, par);
            values.push([i,x]);
            setTimeout(par().bind({}, 'zing' + i), i * 10);
        })
        .seq(function (xs) {
            assert.deepEqual(xs, [10,20,30,40])
            done = true;
        })
        .catch(function (err) {
            errors.push(err);
        })
    ;
    setTimeout(function () {
        assert.deepEqual(values, [[0,1],[1,2],[2,3],[3,4]]);
        assert.ok(!done);
        assert.deepEqual(errors, ['zing0','zing1','zing2','zing3']);
    }, 100);
};
*/
