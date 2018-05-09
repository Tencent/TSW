/**
 * LRU cache based on a double linked list
 */

function ListElement(before,next,key,value){
    this.before = before
    this.next = next
    this.key = key
    this.value = value
}

function Cache(options){
    if(!options)
        options = {}
    this.maxSize = options.maxSize 
    this.reset()
}


Cache.prototype.reset = function(){
    this.size = 0   
    this.cache = {}
    this.tail = undefined
    this.head = undefined
}


Cache.prototype.get = function(key,hit){
    var cacheVal = this.cache[key]
    hit = hit != undefined && hit != null ? hit : true;
    if(cacheVal && hit)
        this.hit(cacheVal)
    else
        return undefined
    return cacheVal.value
}

Cache.prototype.set = function(key,val,hit){
    var actual = this.cache[key]
    hit = hit != undefined && hit != null ? hit : true;
    if(actual){
        actual.value = val
        if(hit) this.hit(actual)
    }else{
        var cacheVal = new ListElement(undefined,undefined,key,val)
        this.cache[key] = cacheVal
        this.attach(cacheVal)
    }
    if(this.size>this.maxSize){
        var tailKey = this.tail.key 
        this.detach(this.tail)
        delete this.cache[tailKey]
    }
}

Cache.prototype.del = function(key){
    var val = this.cache[key]
    if(!val)
        return;
    this.detach(val)
    delete this.cache[key]
}

Cache.prototype.hit = function(cacheVal){
    //Send cacheVal to the head of list
    this.detach(cacheVal)
    this.attach(cacheVal)
}

Cache.prototype.attach = function(element){
    if(!element)
        return;
    element.before = undefined
    element.next = this.head
    this.head = element
    if(!element.next)
       this.tail = element
    else
        element.next.before = element
    this.size++ 
}

Cache.prototype.detach = function(element){
    if(!element)
        return;
    var before = element.before
    var next = element.next
    if(before){
        before.next = next
    }else{
        this.head = next
    }
    if(next){
        next.before = before
    }else{
        this.tail = before
    }
    this.size--
}

Cache.prototype.forEach = function(callback){
    var self = this
    Object.keys(this.cache).forEach(function(key){
        var val = self.cache[key]
        callback(val.value,key)
    })
}
module.exports=Cache
