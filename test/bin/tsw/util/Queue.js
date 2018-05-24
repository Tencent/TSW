const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');
const Queue = plug('util/Queue');
const logger = plug('logger');

logger.setLogLevel('error');

describe('test Queue', () => {

    it('#queue obj(not function)', () => {
        const queue = Queue.create();
        const val = 1;
        expect(queue.queue(val)).to.equal(queue);
    });

    it('#queue function', () => {
        const queue = Queue.create();
        let num = 0;
        const addOne = () => num++;

        queue.queue(addOne);
        queue.queue(() => {
            expect(num).to.equal(1);
        });
        queue.dequeue();
    });

    it('#queue sort', () => {
        const queue = Queue.create();
        let num = 10,
            list = [];
        const addOne = () => list.push(num--);

        queue.queue(addOne);
        queue.queue(() => {
            expect(list.join('.')).to.equal('10');
        });
        queue.queue(addOne);
        queue.queue(() => {
            expect(list.join('.')).to.equal('10.9');
        });
        queue.queue(addOne);
        queue.queue(() => {
            expect(list.join('.')).to.equal('10.9.8');
        });
        expect(list.join('.')).to.equal('10');

        queue.dequeue();
        queue.dequeue();
        queue.dequeue();
        queue.dequeue();
        queue.dequeue();
    });

    it('#dequeue empty', () => {
        const queue = Queue.create();
        expect(queue.dequeue()).to.equal(queue);
    });

    it('#dequeue', () => {
        const queue = Queue.create();
        let num = 10,
            list = [];
        const addOne = () =>
            list.push(num--);

        queue.queue(addOne);
        queue.queue(addOne);
        queue.dequeue();
        queue.queue(() => {
            expect(list.join('.')).to.equal('10.9');
        });

        queue.dequeue();
    });
});
