//python -m SimpleHTTPServer 8080
(function (app) {app.run([function(){
    app.register.factory('icemanForScrollAdjustService', ['timeoutMasterService', function (timeoutMasterService) {

        return function(settings){
            var defaults = {
                $scrollArea:'required',
                itemArray:'required',
                getItemHeightFun:'required',
                operation:'required',
                getInnerWidthFun:function(){return settings.$scrollArea.children().first().outerWidth()},
                itemSelector:'li',
                innerWrapSelector:'div:first-child',
                scrollContainerHeight:settings.$scrollArea.height(),
                scrollHeight:settings.$scrollArea.prop('scrollHeight'),
                elmHeight:settings.$scrollArea.height(),
                scrollPos:dhUtil.getYOffset(settings.$scrollArea),
                icemanDoneFun:function(){},
                getAdjustment:function(){return 0},
                columns:1
            };
            settings = $.extend(defaults,settings)
            for(var key in settings){
                if(settings[key] === 'required'){
                    throw 'icemanForScrollAdjustService requires ' + key
                }
            }            
            var total = 0;
            var totalHeightOfItemsToPreserve = 0;
            var scrollPosDistToScrollBottom = settings.scrollHeight - settings.scrollPos;

            var count = 0;
            for(var i = settings.itemArray.length; i--; ){
                var remainder = i % settings.columns;
                if(remainder === 0){
                    totalHeightOfItemsToPreserve += settings.getItemHeightFun(i,settings.itemArray)
                }
                count++;
                if(totalHeightOfItemsToPreserve >scrollPosDistToScrollBottom){
                    count += remainder;
                    break;
                }
            }

            //some browsers scroll bar takes up width so this value differs from parent width
            var innerWidth = settings.getInnerWidthFun()
            var clone = settings.$scrollArea.clone();
            var itemsAboveScrollInClone = clone.find(settings.itemSelector+':lt('+(settings.itemArray.length - count)+')');
            itemsAboveScrollInClone.remove();
            clone.css({
                'width':innerWidth,
                'position':'absolute',
                'z-index':9999,
                // 'background':'rgba(255,0,0,.1)',
                'overflow':'hidden',
                'height':settings.scrollContainerHeight,
                'opacity':1

            })
            var adjustment = settings.getAdjustment();
            
            var innerWrapStyles = {
                'position':'relative',
                'top':((scrollPosDistToScrollBottom - totalHeightOfItemsToPreserve) - adjustment)
            }
            var $innerWrap = clone.find(settings.innerWrapSelector);
            if($innerWrap.length === 0){
                $innerWrap = $('<div></div>');
                $innerWrap.css(innerWrapStyles);
                clone.wrapInner($innerWrap)
            } else{
                $innerWrap.css(innerWrapStyles);
            }
            settings.$scrollArea.before(clone);
            // $scrollArea.css('opacity',0);
            clone.on('touchstart scroll',function(e){
                e.preventDefault();
                e.stopPropagation();
            });
            settings.$scrollArea.on('scroll.iceLock',function(e){//not sure if this does anything
                e.preventDefault();
                e.stopPropagation();
            })

            var finishedFun = function(){
                // $scrollArea.css('opacity','1');
                clone.remove();
                
                settings.$scrollArea.off('scroll.iceLock');
                settings.icemanDoneFun();
            };

            timeoutMasterService.manage(function(){
                settings.operation(innerWidth,function(icemanDoneCb){
                    timeoutMasterService.manage(finishedFun,100)['catch'](finishedFun);
                });
            },100)['catch'](finishedFun);

            return clone
        };
    }]);
    app.register.directive(
        'infiniteScrollItemDir', ['screenReadyService',function(screenReadyService){
            return function($scope, $elm, attrs) {
                if($scope[$scope.infiniteScrollScope.itemName]){
                    screenReadyService(function(){
                        $scope[$scope.infiniteScrollScope.itemName][$scope.infinitizer.config.name + '_LastHeight'] = $elm.outerHeight(true)
                    })
                }

            };
        }]
    );
    app.register.directive( 'transcope', function() {
        //http://stackoverflow.com/a/24512435/1242000
        return {
            link: function( $scope, $element, $attrs, controller, $transclude ) {
                if ( !$transclude ) {
                    throw minErr( 'ngTransclude' )( 'orphan',
                        'Illegal use of ngTransclude directive in the template! ' +
                        'No parent directive that requires a transclusion found. ' +
                        'Element: {0}',
                        startingTag( $element ));
                }
                var innerScope = $scope.$new();

                $transclude( innerScope, function( clone ) {
                    $element.empty();
                    //ng repeat items were getting parent attributes.. lines below wipe those
                    var attributes = clone[0].attributes;
                    var i = attributes.length;
                    while( i-- ){
                      clone[0].removeAttributeNode(attributes[i]);
                    }
                    $element.append( clone );
                    $element.on( '$destroy', function() {
                        innerScope.$destroy();
                    });
                });
            }
        };
    }); 

    app.register.directive(
        //http://stackoverflow.com/a/14426540/1242000
        'infinitizerDir', [
            'screenReadyService','debounceService','$timeout','$interval','$q','$timeout','debounceMasterService','timeoutMasterService','icemanForScrollAdjustService','timeoutRecursiveService','$parse',
        function(
            screenReadyService,debounceService,$timeout,$interval,$q,$timeout,debounceMasterService,timeoutMasterService,icemanForScrollAdjustService,timeoutRecursiveService,$parse
        ){
            return {
                restrict:'A',
                transclude: 'element',
                replace: true,
                scope: true,
                compile: function (tElement, tAttrs, transclude) {
                  var rpt = document.createAttribute('ng-repeat');
                  rpt.nodeValue = tAttrs.infinitizerDir;
                  tElement.find('.infinitizerItem')[0].attributes.setNamedItem(rpt);
                  // tElement[0].children[0].attributes.setNamedItem(rpt);
                  return function (scope, element, attr) {
                    var ngRepeatLikeStringSplit = attr.infinitizerDir.split(' in ');
                    var rhs = ngRepeatLikeStringSplit[1];
                    scope.infiniteScrollScope.itemName = ngRepeatLikeStringSplit[0]
                    scope.items = $parse(rhs)(scope);
                  }        
                },
                // templateUrl:'basex/infinitizerPartial.html'
                template:'<div infinite-scroll-dir >'+
                    '<ul class="infinitizerResults">'+
                        '<li class="infinitizerItem" infinite-scroll-item-dir transcope  >'+
                        '</li>'+
                    '</ul>'+
                '</div>'
            }
        }]
    );


    app.register.directive(
        'infiniteScrollDir', [
            'screenReadyService','debounceService','$timeout','$interval','$q','$timeout','debounceMasterService','timeoutMasterService','icemanForScrollAdjustService','timeoutRecursiveService','$parse',
        function(
            screenReadyService,debounceService,$timeout,$interval,$q,$timeout,debounceMasterService,timeoutMasterService,icemanForScrollAdjustService,timeoutRecursiveService,$parse
        ){
        debounceMasterServicex = debounceMasterService;
        timeoutMasterServicex = timeoutMasterService;
        var cache = {};
        var getCache = function(name){
            if(typeof cache[name] === 'undefined'){
                cache[name] = {};
                cache[name].scrollPos = 0;
                cache[name].topArchive = [];
                cache[name].resultsArray = [];
                cache[name].bottomArchive = [];
            }
            return cache[name];
        };

        return {
            controller: ['$scope',function($scope){
                $scope.infiniteScrollScope = $scope;
                $scope.scrollPos = 0;
                // $scope.$watch('infiniteScrollSlickInitializationSettings'+$scope.);

                var once = $scope.$watch($scope.pageName + '_infinitizer', function(infinitizerSettingsFromCtrl){
                    if(infinitizerSettingsFromCtrl){
                        once();
                        if(typeof $scope.$widgetScope !== 'undefined'){
                            $scope.$widgetScope.infinitizer = {};
                        } else {
                            $scope.infinitizer = {};
                        }
                        
                        $scope.infinitizer.state = getCache(infinitizerSettingsFromCtrl.name);
                        $scope.infinitizer.config = infinitizerSettingsFromCtrl;
                        $scope.infinitizer.config.columns = typeof $scope.infinitizer.config.columns !== 'undefined' ? $scope.infinitizer.config.columns : 1;
                    }
                });
                    
                
                

            }],
            link:function($scope, $elm, attrs) {
                var konsole = {log:function(){}}
                var fonsole = {log:function(){}}
                $elm.addClass('infinitizer');
                $elm.wrapInner('<div class="infinitizerInner"></div>');
                var $infinitizerInner = $elm.find('.infinitizerInner');
                screenReadyService(function(){
                    var state = $scope.infinitizer.state;
                    var config = $scope.infinitizer.config;


                    //the scrollArea can be outside the $elm.  Like if there's non infinitizer content above the infinitizer content. like on home.
                    var $scrollArea = $elm.closest('.scrollArea');
                    var scrollAreaIsElm = $scrollArea[0] === $elm[0];
                    var $resultsList = $scrollArea.find('.infinitizerResults');
                    if(config.columns > 1){
                        $resultsList.addClass('clearfix');
                    }
                    $resultsList.css('z-index',1)
                    $resultsList.css('position','relative');//to make z-index effective against invisilbe loadMoreButton click
                    $scrollArea.css('position','relative');

                    var fetching = false;
                    var containerHeight;
                    var numberToRequest = config.initialFetchAmt;
                    numberToRequest += numberToRequest % config.columns;
                    
                    var loadMoreButtonClass = function(placement,text,className,arrayName){
                        this.$el = $('<div class="'+className+' hidden">'+text+'</div>');
                        this.showing = false;
                        $resultsList[placement](this.$el);
                        this.height = this.$el.outerHeight();
                        this.arrayName = arrayName;
                    };
                    loadMoreButtonClass.prototype.show = function(){
                        if(!this.showing){
                            this.$el.removeClass('hidden')
                        }
                        this.showing = true;
                    };
                    loadMoreButtonClass.prototype.hide = function(){
                        if(this.showing){
                            this.$el.addClass('hidden')
                        }
                        this.showing = false;
                    };
                    loadMoreButtonClass.prototype.manage = function(){
                        var self = this;
                        if(state[self.arrayName].length !== 0){
                            self.show();
                        } else {
                            self.hide();
                        }
                    };

                    var loadMoreTopButton = new loadMoreButtonClass('before','Load previous','loadMoreTop','topArchive');
                    loadMoreTopButton.$el.on('click',function(){
                        restoreToTop();
                    })
                    //When you click an item, go to that page, then go back, to restore proper scroll pos, it needs to
                    //be showing this button ahead of time.
                    loadMoreTopButton.manage();

                    var loadMoreBottomButton = new loadMoreButtonClass('after','Loading more ...','loadMoreBottom','bottomArchive');
                    
                    var restoreToTop = function(){
                        var beforeHeight = $resultsList.height();
                        var amt = Math.ceil(Math.min(state.topArchive.length,maxItems/3));
                        amt -= amt % config.columns;

                        //fixed mis-alignment during final restoreToTop
                        amt = amt * 2 >= state.topArchive.length ? state.topArchive.length : amt;
                        
                        $scope.$apply(function(){
                            for(var i=0; i<amt;i++){
                                state.resultsArray.push(state.topArchive[state.topArchive.length - 1 - i]);
                            }
                            state.topArchive.splice(state.topArchive.length - amt,amt);
                        });
                        var afterHeight = $resultsList.height();
                        var heightDif = afterHeight - beforeHeight;

                   

                        var toUnshift = state.resultsArray.splice(state.resultsArray.length - (amt),amt);
                        $scope.$apply(function(){
                            for(var i=0,l=toUnshift.length; i<l;i++){
                                state.resultsArray.unshift(toUnshift[i])
                            }
                            removeFromBottom(amt);
                            changeScroll(heightDif + state.scrollPos);
                        });
                    };

                    var removeFromBottom = function(amt){
                        if(amt > 0){
                            var archiveQueue = state.resultsArray.splice(state.resultsArray.length - (amt),amt);
                            for(var i = archiveQueue.length; i--; ){
                                state.bottomArchive.unshift(archiveQueue[i]);
                            }
                            loadMoreBottomButton.manage();
                        }
                    };

                    $scope.infinitizer.reset = function(){
                        needToReset = true;
                        needToResetConstraints = true;
                        resetOrRestoreResults();
                    };

                    var resetOrRestoreResults = function(){
                        if(typeof state.resultsArray === 'undefined' || state.resultsArray.length === 0 || needToReset){
                            timeoutMasterService.clear();
                            isRunning_restoreToBottomTimeoutRecursive = false;
                            theClone.remove();
                            theClone = $();
                            intialIsDone_fetchMoreIfNeeded = false;
                            numberToRequest = maxItems !== null ? maxItems : numberToRequest;//this gets turned to zero after...but we need a good number for restoreToBottom.
                            setupOnce_watchResultData();
                            isAtTheEndOfResponses = false;
                            wasBusy = false;

                            state.resultsArray = [];
                            state.bottomArchive = [];
                            state.topArchive = [];
                            loadMoreTopButton.manage();
                            restoreToBottom()

                        }
                        needToReset = false;
                    };

                    var needToReset = false;
                    var needToResetConstraints = false;
                    if(typeof config.resetDeterminer !== 'undefined'){
                        //when there's an ongoing async thing like a watcher, this loads ammunition that triggerering mechanism
                        config.resetDeterminer({
                            reInit: function(){
                                needToReset = true;
                            },
                            reConstraints: function(){
                                needToResetConstraints = true;
                            },
                            resetOrRestoreResults:resetOrRestoreResults
                        })

                    } else {
                        //If there's no resetPropertyName, just get results.
                        resetOrRestoreResults();
                    }

                    
                    
                    

                    var isRunning_restoreToBottomTimeoutRecursive = false;
                    var maxItems = null;
                    var wasBusy = false;
                    var afterRestoreToBottom = function(){
                        var resultsArray = state.resultsArray;
                        if(resultsArray.length > 0 ){
                            debounceMasterService.manage('debX_'+config.name,function debxCb(){

                                //if a user comes up in search results with a blocked=true, splice them out.
                                //TODO get block-user-list-update working
                                // $scope.$apply(function(){
                                //     for(var i = resultsArray.length; i--; ){
                                //         if(resultsArray[i].blocked){
                                //             resultsArray.splice(i,1)
                                //         }
                                //     }
                                // });

                                scrollHeight = $scrollArea.prop('scrollHeight');
                                if(!scrollAreaIsElm){elmHeight = $elm.outerHeight();}
                                containerHeight = containerHeight ? containerHeight : $scrollArea.outerHeight();
                                if(!intialIsDone_fetchMoreIfNeeded){

                                    fetchMoreIfNeeded();
                                    intialIsDone_fetchMoreIfNeeded = true;
                                } else {
                                    if(state.bottomArchive.length<maxItems){
                                        fetchMoreIfNeeded();
                                    }
                                }                         
                            },0,true);
                        }
                    }
                    var restoreToBottom = function(bottomArchiveHasInitialItems){

                        if(isRunning_restoreToBottomTimeoutRecursive === false){

                            if(!bottomArchiveHasInitialItems && !isAtTheEndOfResponses){

                                var amtToFetch = maxItems !== null ? maxItems - state.bottomArchive.length: config.initialFetchAmt * 2;
                                if(!fetching  && amtToFetch > 0){
                                    callEndpoint(amtToFetch,endpointCallHandler);
                                }
                            }/* else {
                                fonsole.log('bottomArchiveHasInitialItems so transfer to resultsArray')
                            }*/
                            var amt;
                            if(maxItems !== null){
                                amt = maxItems - state.resultsArray.length;
                                amt +=  amt % config.columns !== 0 ? config.columns - (amt % config.columns) : 0;
                            } else {
                                amt = config.initialFetchAmt;
                            }
                            amt = amt > state.bottomArchive.length ? state.bottomArchive.length : amt;
                            amt = amt > 0 ? amt :0;
                            // var amt = state.bottomArchive.length < numberToRequest ? state.bottomArchive.length : numberToRequest;
                            // var modulusOfAmt = amt % config.columns;                            
                            // amt = isAtTheEndOfResponses && amt === state.bottomArchive.length ? amt : amt - modulusOfAmt;
                            // amt = bottomArchiveHasInitialItems && amt === 0 ? state.bottomArchive.length : amt; //case of 1 intial item in multi
                            if(amt > 0){

                                isRunning_restoreToBottomTimeoutRecursive = true;
                                timeoutRecursiveService(
                                    amt,
                                    0,
                                    function(i){
                                        if(state.bottomArchive.length > 0) {
                                            state.resultsArray.push(state.bottomArchive[0]);
                                            state.bottomArchive.splice(0,1);
                                        }
                                    },
                                    function(i){
                                        isRunning_restoreToBottomTimeoutRecursive = false;

                                        if(state.bottomArchive.length === 0){
                                            loadMoreBottomButton.manage();
                                        } else {
                                            loadMoreBottomButton.manage();
                                        }

                                        afterRestoreToBottom();

                                        if(wasBusy === true){
                                            wasBusy = false;
                                            restoreToBottom();
                                        }
                                    }
                                );
                            }
                        } else {
                            wasBusy = true;
                        }
                    };
                                        

                    var callEndpoint = function(quantityToRetreive,cb){
                        fetching = true;
                        if(needToResetConstraints){
                            delete state.constraints;
                            needToResetConstraints = false;
                        }
                        if(typeof state.constraints === 'undefined'){
                            state.constraints = {offset:0};
                        }
                        state.constraints.limit = quantityToRetreive;
                        var hubModel = config.assembleHubModel(state.constraints,state);
                        config.callEndpoint(hubModel)
                        .then(function(response){
                            var processedResults;
                            if(typeof config.resultPathInResponse !== 'undefined'){
                                processedResults = dhUtil.propertyAt(response,config.resultPathInResponse)
                            } else {
                                processedResults = response;
                            }
                            
                            if(typeof cb !== 'undefined'){
                                cb(processedResults,state.constraints);
                            }
                        });
                    };
                    var isAtTheEndOfResponses = false;
                    var endpointCallHandler = function(processedResults,constraints){

                        if(processedResults.length > 0){
                            for(var i =0, l = processedResults.length; i<l; i++ ){
                                state.bottomArchive.push(processedResults[i])
                            }
                            constraints.offset = constraints.offset + processedResults.length;
                            screenReadyService(function endpointCallHandlerscreenReadyService(){
                                fetching = false;
                                fetchMoreIfNeeded();
                            })
                        } else {
                            console.log('SERVER RESPONDED WITH ZERO RESULTS');

                            fetching = false;
                            isAtTheEndOfResponses = true;
                            loadMoreBottomButton.manage();
                        }                     
                    };


                    var destroyed = false;
                    var fetchMoreIfNeeded = function(){
                        // console.trace()
                        if(!destroyed){
                            if(state.resultsArray.length !== 0){
                                
                            /*
                                   ______________________
                                  | ____________________ |
                                  || loadMoreTopButton  ||
                                  ||____________________||
                                  | ____________________ |
                                  ||                    ||
                                  ||                    ||
                                  ||                    ||
                                  ||____________________||
                                  | ____________________ |
                                  ||                    ||
                                  ||                    ||
                                 _|______________________|
                                |s| # # # # # # # # # # #|
                                |c|# # # # HEADER # # # #|
                                |r|_#_#_#_#_#_#_#_#_#_#_#|_#_#_#_#__scrollPos       
                                |e||                    ||     /\                   
                                |e||                    ||     ||
                                |n||____________________||     ||                   
                                | | ____________________ |     ||                   
                                | ||                    ||     ||                   
                                | ||                    ||     ||
                                | ||                    ||     ||                   
                                | ||____________________||  containerHeight         
                                | | ____________________ |     ||                   
                                | ||                    ||     ||
                                | ||                    ||     \/
                                --||--------------------||--------elmBottomPos
                                  ||____________________||
                                  | ____________________ |
                                  ||        /\          ||
                                  ||average || ItemHeigh||   
                                  ||        \/          ||
                                  ||____________________||
                                  | ____________________ |
                                  ||                    ||
                                  ||                    ||
                                  ||                    ||
                                  ||____________________||
                                  ||____________________||
                                  ||loadMoreBottomButton||
                                  ||____________________||
                                  |______________________|____________________ scrollHeight
                                  ..                    ..     /\
                                {{items below are due}} ..     .. 
                                  ..                    ..     ..
                                  | ____________________ |     ||                   
                                  ||                    ||     ||                   
                                  ||                 ----------||-------------------+
                                  ||                    ||     ||          amtItemsToFillDeficit(count)
                                  ||____________________||     ||                   |
                                  | ____________________ |  scrollHeightDeficit     |
                                  ||                    ||     ||                   |
                                  ||                 ----------||-------------------+
                                  ||                    ||     ||
                                  ||____________________||     \/
                                  |______________________|---------------- verticalDownLimitScrollPos

                            */


                                var adjustment = 0;
                                adjustment += loadMoreTopButton.showing ? loadMoreTopButton.height : 0;
                                adjustment += loadMoreBottomButton.showing ? loadMoreBottomButton.height : 0;

                                scrollHeight = $scrollArea.prop('scrollHeight');
                                if(!scrollAreaIsElm){elmHeight = $elm.outerHeight();}

                                var elmBottomPos = containerHeight ? state.scrollPos + containerHeight : state.scrollPos;
                                var heightPropertyName = config.name + '_LastHeight';
                                var allHeights = 0;
                                var aLength = state.resultsArray.length;
                                var totalCount = aLength;
                                for(var i=0,l=aLength;i<l;i++){
                                    var itemHeight = state.resultsArray[i][heightPropertyName];
                                    
                                    if(typeof itemHeight === 'number'){
                                        allHeights += state.resultsArray[i][heightPropertyName];
                                    } else {
                                        totalCount --;
                                        // log('why no height?',state.resultsArray[i][heightPropertyName],state.resultsArray[i])
                                    }

                                   
                                }

                                var averageItemHeight = (allHeights/totalCount);
                                // var averageItemHeight = ((scrollHeight-adjustment)/state.resultsArray.length)*config.columns; 
                                var verticalDownLimitScrollPos = config.maxScreens * containerHeight;                                
                                var scrollHeightDeficit = (verticalDownLimitScrollPos - (scrollHeight - adjustment));
                                
                                var amtItemsToFillDeficit = scrollHeightDeficit > 0 ? scrollHeightDeficit/averageItemHeight : 0;
                                amtItemsToFillDeficit += config.columns;
                                amtItemsToFillDeficit -= amtItemsToFillDeficit % config.columns;
                                numberToRequest = Math.max(Math.ceil(amtItemsToFillDeficit),0);


                                 // * config.maxScreens
                                if(typeof containerHeight !== 'undefined' && averageItemHeight !== 0){

                                    var itemsPerScreenHypothetical = (containerHeight/averageItemHeight) * config.columns;
                                    maxItems = Math.floor(itemsPerScreenHypothetical * config.maxScreens);
                                    maxItems -= (maxItems % config.columns);
                                }
                                /*var toConsole = {
                                    scrollHeight:scrollHeight,
                                    elmBottomPos:elmBottomPos,
                                    itemsPerScreen:itemsPerScreen,
                                    containerHeight:containerHeight,
                                    averageItemHeight:averageItemHeight,
                                    verticalDownLimitScrollPos:verticalDownLimitScrollPos,
                                    scrollHeightDeficit:scrollHeightDeficit,
                                    amtItemsToFillDeficit:amtItemsToFillDeficit,
                                    numberToRequest:numberToRequest
                                }*/
                                if(Math.abs(elmBottomPos-scrollHeight) < containerHeight/2 && scrollHeight/* - adjustment*/ > containerHeight && state.resultsArray.length >= maxItems){
                                    killLosersAndAdjust();
                                }

                                restoreToBottom();                                
                            } else {
                                restoreToBottom(true);
                            }
                        }                    
                    };
                    
                    
                    var scrollHeight = 0;
                    var elmHeight = 0;
                    
                    var getHeights = function(){
                        scrollHeight = $scrollArea.prop('scrollHeight');
                        if(!scrollAreaIsElm){elmHeight = $elm.outerHeight();}
                        containerHeight = $scrollArea.outerHeight();
                        
                        
                        //TODO reimplement the logic below.

                        /*var maxScroll = scrollHeight-containerHeight;

                        //If the results elements combined height is too short to have any scroll
                        //then call for more results.
                        if(maxScroll < -10){
                            
                            callEndpoint(numberToRequest,endpointCallHandler);
                            
                        }*/
                    };

                    
                    //TODO make window resize adjustment
                    // pubSubService.subscribe('stickyPos-'+$scope.widgetNamespace,function(stickyPos){
                    //     if(intialIsDone_fetchMoreIfNeeded){
                    //         konsole.log('++++','stickyPos')
                    //         // getHeights();
                    //     }
                    // },$scope);

                    




                    var generateWinnersAndLosersObject = function(){

                        var resultsArray = state.resultsArray;
                        var heightPropertyName = config.name + '_LastHeight';

                        var closestAmountAboveTop = null;
                        var userClosestToTopAndAboveTop = null;
                        var previousUser = null;
                        var previousAmountAboveTop = null;
                        var winnerAmountAboveTop = null;
                        var firstPlaceWinner = null;
                        var winners = [];
                        var losersTop = [];
                        var losersBottom = [];
                        var lastOneFound = false;
                        var totalHeight = 0;
                        var adjustment = loadMoreTopButton.showing ? loadMoreTopButton.height : 0;
                        var columns = config.columns
                        
                        for(var i=0,l=resultsArray.length; i<l; i++){
                            var user = resultsArray[i];
                            var userPos = totalHeight;
                            totalHeight = i % columns === 0 ? totalHeight + user[heightPropertyName] : totalHeight; //only the first of each row contribute to totalHeight
                            var pxAboveTop = i % columns === 0 ? (state.scrollPos - userPos) : previousAmountAboveTop;
                            var pxAboveTopAdjusted = pxAboveTop - adjustment;
                            var adjustedTop = config.preserveTopScreenAmt * containerHeight;
                            adjustedTop = Math.min(adjustedTop, state.scrollPos);
                            if(!destroyed || !config.chopTopOnDestroy){
                                pxAboveTopAdjusted -=  adjustedTop;
                            }

                            if(closestAmountAboveTop !== null){
                                var conditionsEnsuringAtLeastOneWinner = firstPlaceWinner === null && i < l-1;
                                if(pxAboveTopAdjusted >= 0 && conditionsEnsuringAtLeastOneWinner){
                                    if(pxAboveTopAdjusted < closestAmountAboveTop){
                                        closestAmountAboveTop = pxAboveTop
                                        userClosestToTopAndAboveTop = user;
                                        losersTop.push(user);
                                    }
                                } else{
                                    if(firstPlaceWinner === null){
                                        firstPlaceWinner = previousUser;
                                        winnerAmountAboveTop = previousAmountAboveTop;
                                        // for(var i = columns; i--; ){
                                        for(var ii=0,ll=columns;ii<ll;ii++){
                                            var poppedItem = losersTop.pop();;
                                            winners.unshift(poppedItem);
                                            
                                        }
                                        // winners.push(previousUser);
                                        // losersTop.pop();//the one we are popping off is the winner! It was added to losers last iteration.
                                    }

                                    if(firstPlaceWinner !== null){
                                        var distanceAboveBottom = (-pxAboveTop - containerHeight);
                                        if(distanceAboveBottom > 0){
                                            lastOneFound = true;
                                        }
                                        winners.push(user);
                                    }
                                }
                            } else {
                                closestAmountAboveTop = pxAboveTop;
                                userClosestToTopAndAboveTop = user;
                                losersTop.push(user);
                                if(pxAboveTop < 0){
                                    throw 'no items above top';
                                }
                            }
                            if(pxAboveTop + containerHeight < adjustment){
                                losersBottom.push(user)
                            }
                            previousAmountAboveTop = pxAboveTop;
                            previousUser = user;
                        }
                        return {
                            winners:winners,
                            winnerAmountAboveTop:winnerAmountAboveTop,
                            losersTop:losersTop,
                            losersBottom: losersBottom
                        };
                    };

                    var intialIsDone_fetchMoreIfNeeded = false;
                    
                    var changeScroll = function(scrollPos){
                        var adjustment = 0;
                        if(state.topArchive.length > 0 && !loadMoreTopButton.showing){
                            loadMoreTopButton.manage();
                            adjustment = loadMoreTopButton.height;
                        } else if(state.topArchive.length === 0 && loadMoreTopButton.showing){
                            loadMoreTopButton.manage();
                            adjustment = -loadMoreTopButton.height;
                        }
                        $scrollArea.scrollTop(scrollPos+adjustment)
                    };

                    var alreadyWatching = false;
                    var setupOnce_watchResultData = function(){
                        if(!alreadyWatching){
                            alreadyWatching = true;
                            var watchResultDataOnce = $scope.$watch('infinitizer.state.resultsArray',function(newData){
                                if(typeof newData !== 'undefined'){
                                    watchResultDataOnce();
                                    alreadyWatching = false;
                                    screenReadyService(function(){
                                        var scrollAmt = state.scrollPos;
                                        if(scrollAmt !== 0){
                                            changeScroll(scrollAmt);
                                        } else {
                                            fetchMoreIfNeeded()
                                        }
                                    
                                    })
                                }
                            });
                        }
                    };
                    setupOnce_watchResultData();

                    var generateWinnersAndLosersObject_thenProcessStateArrays = function(winnersAndLosersObject){
                        var winnersAndLosersObject = typeof winnersAndLosersObject !== 'undefined' ? winnersAndLosersObject : generateWinnersAndLosersObject();
                        var losersTop = winnersAndLosersObject.losersTop;
                        var losersBottom = winnersAndLosersObject.losersBottom;
                        if(losersTop.length > 0){
                            var archiveQueue = state.resultsArray.splice(0,losersTop.length);
                            for(var i=0,l=losersTop.length;i<l;i++){
                                state.topArchive.push(losersTop[i])
                            }
                            state.scrollPos = winnersAndLosersObject.winnerAmountAboveTop;
                        }
                        if(losersBottom.length > 0){
                            removeFromBottom(losersBottom.length);
                        }
                        return winnersAndLosersObject;
                    };

                    

                    var theClone = $();
                    var killLosersAndAdjust = function(cb){                        
                        if(theClone.length === 0 && state.bottomArchive.length !== 0){
                            var cachedCb;

                            var winnersAndLosersObject = generateWinnersAndLosersObject();
                            
                            if(winnersAndLosersObject.losersTop.length > 0){
                                cachedCb = cb;
                                theClone = icemanForScrollAdjustService({
                                    $scrollArea:$scrollArea,
                                    itemArray:state.resultsArray,
                                    itemSelector:'.infinitizerItem',
                                    innerWrapSelector:'.infinitizerInner',
                                    scrollContainerHeight:containerHeight,
                                    scrollHeight:scrollHeight,
                                    elmHeight:elmHeight,
                                    scrollPos:state.scrollPos,
                                    columns:config.columns,
                                    icemanDoneFun:function(){
                                        theClone = $();
                                    },
                                    getInnerWidthFun:function(){
                                        return $infinitizerInner.width();
                                    },
                                    getItemHeightFun:function(i,itemArray){
                                        var heightPropertyName = config.name + '_LastHeight';
                                        return itemArray[i][heightPropertyName];
                                    },
                                    getAdjustment:function(){
                                        var adjustment = loadMoreTopButton.showing ? 2*loadMoreTopButton.height : loadMoreTopButton.height;
                                        if(!scrollAreaIsElm){
                                            adjustment += (scrollHeight - elmHeight);
                                        }
                                        return adjustment;
                                    }, 
                                    operation:function(itemWidth,icemanDoneWithTimeout){

                                        generateWinnersAndLosersObject_thenProcessStateArrays(winnersAndLosersObject);
                                        
                                        if(winnersAndLosersObject.losersTop.length > 0){
                                           
                                            $scrollArea.css({
                                                'overflow-y':'hidden',
                                                'width': itemWidth
                                            });
                                            changeScroll(winnersAndLosersObject.winnerAmountAboveTop)
                                            screenReadyService(function(){
                                                $scrollArea.css({
                                                    'overflow-y':'',
                                                    'width': ''
                                                });
                                                icemanDoneWithTimeout();
                                            });
                                            
                                            if(cachedCb){
                                                cachedCb()
                                            }
                                            
                                        }
                                    },
                                    
                                                                       
                                });
                            }
                        }
                        //Create clone of the scrollElm.  Plop it on top.  Them perform scrollbust overflow manipulation on original.
                        //This hides a visible flash that scroll busting causes.
                    };

                    $scrollArea.on('scroll',function(e){
                        state.scrollPos = dhUtil.getYOffset($scrollArea);
                        var deb = debounceMasterService.manage('scrollDeb_'+config.name,function(){
                            fetchMoreIfNeeded();
                        },100,true);   
                    });

                    $scope.$on('$destroy',function(){
                        destroyed = true;

                        var startingTopArchiveLength = state.topArchive.length;
                        generateWinnersAndLosersObject_thenProcessStateArrays();
                        var endingTopArchiveLength = state.topArchive.length;
                        if(startingTopArchiveLength === 0 && endingTopArchiveLength !== 0){
                            //when no topLoadingButton before destroy, but chopTopOnDestroy yields toLoadingButton when returning to infinitizer
                            state.scrollPos += loadMoreTopButton.height;
                        }
                        timeoutMasterService.clear();
                    })
                })
            }


        };
    }]);
}]);})(app);