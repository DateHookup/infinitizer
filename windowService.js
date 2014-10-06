    infinitizerModule.factory('windowService', [
        '$http', '$q', '$log', '$window', '$timeout','$rootScope','debounceService',
        function ($http, $q, $log, $window, $timeout,$rootScope,debounceService) {


        var debounce = function($timeout, func, threshold, execAsap, firstAsap) {
            var timeout;
            var firstAsapClear = false;
            if (typeof firstAsap === 'undefined' || firstAsap === null || firstAsap === false) {
                firstAsap = false;
            } else {
                firstAsapClear = true;
            }
            return function debounced() {
                var obj = this,
                    args = arguments;

                function delayed() {
                    if (!execAsap)
                        func.apply(obj, args);
                    if (firstAsap) {
                        firstAsapClear = true;
                    }
                    timeout = null;
                };

                if (timeout) {
                    $timeout.cancel(timeout);
                } else if (execAsap) {
                    func.apply(obj, args);
                } else if (firstAsapClear) {
                    console.log('FAST')
                    func.apply(obj, args);
                    firstAsapClear = false;
                }

                timeout = $timeout(delayed, threshold || 100);
            };
        }



        var windowData = {};
        var jWindow = $($window);
        windowData.jWindow = jWindow;
        //Derived from http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
        //Debouncing prevents rapid fire resize events.
        //event is only fired if it's been still for a moment.
        //This is a service.  Once instantiated, the listener will persist if all instantiations die.
        //It's also a singleton, so only one listener can exist at a time.
        //On resize event, update width and height properties.

        var scrollAmt = 0;

        var $appContainer = $('.staticHtmlThatWrapsApp');
        var setData = function(){
            windowData.width = jWindow.width();
            windowData.appWidth = $appContainer.width();

            // windowData.height = jWindow.height() - scrollAmt;
            //IOS7 Ipad content is a little taller than the window.  Window innerHeight helps fix this. 
            windowData.height = window.innerHeight;

        }

        setData();

        var deb = debounceService(100);

        windowData.onResize = function(cb,$scope){
            var eventName = 'resize';

            if(typeof $scope !== 'undefined'){
                eventName += ('.' + $scope.$id);      
                $scope.$on('$destroy', function() {
                    jWindow.off(eventName);
                });
            }


            
            // jWindow.on(
            //     eventName,
            //     function(){
            //         deb.reset(function(){
            //             if($rootScope.signUpModeOff){
            //                 jWindow.scrollTop(0);
            //             }
            //             console.log('xxx')
            //             cb.call(null,arguments);
            //         },0)
            //     }
            // );


            jWindow.on(eventName,debounce($timeout,function(){
                if($rootScope.signUpModeOff){
                    jWindow.scrollTop(0);
                    console.log('jWindow.scrollTop(0)')
                }
                
                cb.call(null,arguments);
            }));
            // jWindow.on(eventName,dhUtil.debounce($timeout,function(){
      //           if($rootScope.signUpModeOff){
      //               jWindow.scrollTop(0);
      //               console.log('jWindow.scrollTop(0)')
      //           }
                
            //  cb.call(null,arguments);
            // }));

                  
        };
        windowData.onResize(function(){
            setData();
        })

        windowData.resize = function(){
            jWindow.resize()
        };


        


        /*
        //Patches iOs keyboard screen size misreporting bug

        var focus = false;;


        var cachedHeight = null;
        
        var resized = false;

        pubSubService.subscribe('currentFocus',function(x){
            console.log('asdf',x)
            focus = x;

            if(x !== null){
               focus = true;
            } else {
                scrollAmt = 0;
                resized = false;
                jWindow.resize();
            }

        },null);

        window.onscroll = function () { 
            console.log('scroll',jWindow.scrollTop())
            if(focus && !resized){
                var limit = Math.max( document.body.scrollHeight, document.body.offsetHeight, 
                document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
                window.scrollTo(0, limit); 
                console.log('scrollpppp',jWindow.scrollTop())
                resized = true;
                scrollAmt = jWindow.scrollTop();
                console.log(scrollAmt);
                jWindow.resize();
                window.scrollTo(0, 0); 
                
            }
            
        };
        */

        /*
        //PREVENT IOS OVERSCROLL
        //http://stackoverflow.com/a/14244680

        // console.log()
        // $('.staticHtmlThatWrapsApp').on('touchmove',function(e){
        //     console.log('asdfasdfasd')
        //     e.preventDefault();
        //     e.stopPropagation();
        // })

        var selScrollable = '[evade-sticky-directive]';
        // Uses document because document will be topmost level in bubbling
        $(document).on('touchmove',function(e){
          e.preventDefault();
        });
        // Uses body because jQuery on events are called off of the element they are
        // added to, so bubbling would not work if we used document instead.
        $('body').on('touchstart', selScrollable, function(e) {
            console.log('asdfasdfas')
          if (e.currentTarget.scrollTop === 0) {
            e.currentTarget.scrollTop = 1;
          } else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
            e.currentTarget.scrollTop -= 1;
          }
        });
        // Stops preventDefault from being called on document if it sees a scrollable div
        $('body').on('touchmove', selScrollable, function(e) {
            console.log('asdfasdf')
          e.stopPropagation();
        });

        */

        return windowData;
    }]);
