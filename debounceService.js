    /*timeoutMasterServicex= timeoutMasterService;
    debounceMasterServicex=debounceMasterService;
    var asdf = timeoutMasterService.manage(function(){
        console.log('zxcvzxv');
    },1000)
    console.log('asdf',asdf);

    var qwer = timeoutMasterService.manage($timeout(function(){},100,$scope))
    timeoutMasterService.clear()
    console.log(timeoutMasterService)*/

    // timeoutMasterService.manage(function(){
    //     console.log('zxcvzxv');
    // },1000)
    // debounceMasterService.manage('asdf',fetchMoreIfNeeded,1000,true,$scope);

    infinitizerModule.factory('screenReadyService', ['$q', '$timeout', function ($q, $timeout) {
        //This service helps with the angular issue where you have to wrap directive guts in timeout if it has
        // on instantiation behavior... like getting an element's height when it appers.
        // So if a view has multiple directives with timeout issues, that sucks because you have multiple timeouts.
        // This service collects those timeouts into a single timeout with the help of deferreds.
        // If there's a timeout deferred already, it chains onto its promise.
        // If there's not, it creates a new deferred.
        
        var def = null;
        var checkAndChain = function(cb){
            //if deferred not initialized
            if(def === null){
                //initialize a deferred
                def = $q.defer();
                //set a timeout that when complete
                $timeout(function(){
                    //resolves the deferred chain
                    def.resolve();
                    //and resets the deferred to null
                    def = null;
                });
            }
            //if it's a fresh deferred or an already initialized defreed, chain the passed callback
            def.promise.then(cb)

            //So all callbacks passed before the timeout completes should be called in immediate succession.
        };
        return checkAndChain;
    }]);

    infinitizerModule.factory('debounceService', ['$http', '$q', '$log', '$window', '$timeout', function ($http, $q, $log, $window, $timeout) {
        var obj = function (threshold, execAsap) {
            this.timeout;
            this.def = $q.defer();
            this.promise = this.def.promise;
            this.threshold = threshold || 100;
        }

        obj.prototype.reset = function(func, execAsap){

            var self = this;
            var delayed = function(){
                func();
                self.timeout = null;
            };

            if (this.timeout){
                $timeout.cancel(self.timeout);
            }

            this.timeout = $timeout(delayed, this.threshold);

            return this.timeout;
        }
        
        function returnNew(threshold){
            return new obj(threshold);
        }

        return returnNew;
    }]);
    infinitizerModule.factory('debounceMasterService', ['debounceService','timeoutMasterService', function (debounceService,timeoutMasterService) {
        var DebounceMaster = function(){
            this.registry = {};
        };
        DebounceMaster.prototype.fake = function(){
            return {
                // deb: {
                    debounce:{
                        def:{
                            reject: function(){}
                        },
                        reset:function(){}
                    }
                // }
            }
        }
        DebounceMaster.prototype.manage = function(key, operation, time, addToTimeoutMasterService, $scope){
            var self = this;
            var isFirstDebounce = typeof self.registry[key] === 'undefined';
            if(isFirstDebounce){
                self.registry[key] = {debounce:debounceService(time)};
            }
 
            self.registry[key].debounce.reset(operation,true,key);//This causes registry unassignment via the "catch" below.
            self.registry[key].id = self.registry[key].debounce.timeout.$$timeoutId;

            (function(oldId){
                self.registry[key].debounce.timeout['catch'](function(){//Now that we've reassigned it, we can refernce it again.
                    if(self.registry[key] && self.registry[key].id === oldId){//Cannot read property 'id' of undefined
                        delete self.registry[key]; //this is when it gets cancelled by the timeoutMaster.
                    }
                })
            })(self.registry[key].id);
            
            self.registry[key].debounce.timeout.then(function(){
                delete self.registry[key];
            });

            $scope.$on('$destroy',function(){
                delete self.registry[key];
            });

            if(addToTimeoutMasterService){
                timeoutMasterService.manage(self.registry[key].debounce.timeout);
            }

            return self.registry[key];
        };

        var debounceMaster = new DebounceMaster();

        return debounceMaster;
    }]);
    infinitizerModule.factory('timeoutMasterService', ['$timeout', function ($timeout) {
        var TimeoutMaster = function(){
            this.registry = {};
        };
        TimeoutMaster.prototype.manage = function($timeoutOrOperation,time){
            var toRegister = typeof $timeoutOrOperation['$$timeoutId'] === 'undefined' ? $timeout($timeoutOrOperation,time) : $timeoutOrOperation;
            
            var self = this;
            var key = new Date().getTime()+'X';
            self.registry[key] = toRegister;

            self.registry[key].then(function(){
                delete self.registry[key];
            });
            self.registry[key]['catch'](function(){
                delete self.registry[key];
            })

            return self.registry[key];
        };
        TimeoutMaster.prototype.clear = function(){
            for(var key in this.registry){
                $timeout.cancel(this.registry[key])
                // delete this.registry[key];
            }
        };

        var timeoutMaster = new TimeoutMaster();

        return timeoutMaster;
    }]);
    infinitizerModule.factory('timeoutRecursiveService', ['timeoutMasterService', function (timeoutMasterService) {
        var timeoutRecursive = function(l, speed, useTimeout, operation, cb){
            l = typeof l === 'undefined' ? array.length : l;
            var realSpeed = 0;
            var i = 0;
            var recursive;
            if(useTimeout){
                var recursive = function(l,operation){
                    operation(i);
                    timeoutMasterService.manage(function(){
                        // console.log(realSpeed)
                        realSpeed = speed;
                        i++;
                        if(i < l){
                            recursive(l,operation);
                        } else {
                            cb(i);
                            //console.log('i do not like that this extra timeout fires.  should be canceled.')
                        }
                    },realSpeed)
                };
            } else {
                recursive = function(l,operation){
                    operation(i);
                    i++;
                    if(i < l){
                        recursive(l,operation);
                    } else {
                        cb(i);
                        //console.log('i do not like that this extra timeout fires.  should be canceled.')
                    }
                };
            }
            
            if(l !== 0){
                recursive(l,operation);
            } else {
                cb()
            }
        };
        /*var a = ['x','y','z'];
        timeoutRecursive(
            a.length,
            1000,
            function(i){
                console.log('OPERATION',i,a[i]);
            },
            function(i){
                console.log('done');
            }
        );*/

        return timeoutRecursive;
    }]);
