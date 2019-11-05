import * as assert from 'assert'

import { add } from '../../src/core/add'

describe('test add', function() {
    it('add(1,2)=3', function(done) {
        assert(add(1, 2) === 3)
        done()
    })
})
