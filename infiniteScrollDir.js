//python -m SimpleHTTPServer 8080
(function (app) {app.run([function(){
    app.register.factory('icemanForScrollAdjustService', ['timeoutMasterService', function (timeoutMasterService) {

        return function($scrollArea,itemArray,getItemHeightFun,getInnerWidthFun,itemSelector,innerWrapSelector,operation,scrollContainerHeight,scrollContainerWidth,scrollHeight,elmHeight,scrollPos,icemanDoneFun,getAdjustment,columns){
            // console.log(columns)
            scrollContainerHeight = typeof scrollContainerHeight !== 'undefined' ? scrollContainerHeight : $scrollArea.outerHeight();
            scrollContainerWidth = typeof scrollContainerWidth !== 'undefined' ? scrollContainerWidth : $scrollArea.outerWidth();
            scrollHeight = typeof scrollHeight !== 'undefined' ? scrollHeight : $el.prop('scrollHeight');
            scrollPos = typeof scrollPos !== 'undefined' ? scrollPos : dhUtil.getYOffset($el);
            getAdjustment = typeof getAdjustment !== 'undefined' ? getAdjustment : function(){return 0;};
            var total = 0;
            var totalHeightOfItemsToPreserve = 0;
            var scrollPosDistToScrollBottom = scrollHeight - scrollPos;

            var count = 0;
            for(var i = itemArray.length; i--; ){
                // totalHeightOfItemsToPreserve += getItemHeightFun(i,itemArray);
                var remainder = i % columns;
                // console.log('remainder',remainder,'columns',columns)
                if(remainder === 0){
                    totalHeightOfItemsToPreserve += getItemHeightFun(i,itemArray)
                }
                count++;
                if(totalHeightOfItemsToPreserve >scrollPosDistToScrollBottom){
                    count += remainder;
                    break;
                }
            }

            //some browsers scroll bar takes up width so this value differs from parent width
            var innerWidth = getInnerWidthFun()
            var clone = $scrollArea.clone();
            var itemsAboveScrollInClone = clone.find(itemSelector+':lt('+(itemArray.length - count)+')');
            itemsAboveScrollInClone.remove();
            clone.css({
                'width':innerWidth,
                'position':'absolute',
                'z-index':9999,
                // 'background':'rgba(255,0,0,.1)',
                'overflow':'hidden',
                'height':scrollContainerHeight,
                'opacity':1

            })
            var adjustment = getAdjustment();
            
            var innerWrapStyles = {
                'position':'relative',
                'top':((scrollPosDistToScrollBottom - totalHeightOfItemsToPreserve) - adjustment)/* - (scrollHeight - elmHeight) */
            }
            var $innerWrap = clone.find(innerWrapSelector);
            if($innerWrap.length === 0){
                $innerWrap = $('<div></div>');
                $innerWrap.css(innerWrapStyles);
                clone.wrapInner($innerWrap)
            } else{
                $innerWrap.css(innerWrapStyles);
            }
            $scrollArea.before(clone);
            // $scrollArea.css('opacity',0);
            clone.on('touchstart scroll',function(e){
                e.preventDefault();
                e.stopPropagation();
            });
            $scrollArea.on('scroll.iceLock',function(e){//not sure if this does anything
                e.preventDefault();
                e.stopPropagation();
            })

            var finishedFun = function(){
                // $scrollArea.css('opacity','1');
                clone.remove();
                
                $scrollArea.off('scroll.iceLock');
                icemanDoneFun();
            };

            timeoutMasterService.manage(function(){
                operation(innerWidth,function(icemanDoneCb){
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
                var $infinitizerInner = $elm.find('.infinitizerInner')
                screenReadyService(function(){
                    //the scrollArea can be outside the $elm.  Like if there's non infinitizer content above the infinitizer content. like on home.
                    var $scrollArea = $elm.closest('.scrollArea');
                    var scrollAreaIsElm = $scrollArea[0] === $elm[0];
                    var $resultsList = $scrollArea.find('.infinitizerResults');
                    $resultsList.css('z-index',1)
                    if($resultsList.length === 0){
                        throw 'missing element with class of "infinitizerResults"'
                    }
                    $scrollArea.css('position','relative');
                    $resultsList.css('position','relative');//to make z-index effective against invisilbe loadMoreButton click

                    var fetching = false;
                    var containerHeight;
                    var numberToRequest = $scope.infinitizer.config.initialFetchAmt;
                    numberToRequest += numberToRequest % $scope.infinitizer.config.columns
                    // var numberOfContainerHeightsBelowBottomBeforeFetching = $scope.infinitizer.config.numberOfContainerHeightsBelowBottomBeforeFetching;
                    // var chunkAmt = $scope.infinitizer.config.numberOfContainerHeightsToAddToBottom;

                    var returnResultsArray = function(){
                        return $scope.infinitizer.state.resultsArray;
                    };


                    // $('body').css('overflow','hidden')

                    
                    
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
                        // debounceMasterService.manage('debX',function(){
                            if($scope.infinitizer.state[self.arrayName].length !== 0){
                                self.show();
                            } else {
                                self.hide();
                            }
                        // },300,true);
                    };
                    var loadMoreTopButton = new loadMoreButtonClass('before','Load previous','loadMoreTop','topArchive');
                    loadMoreTopButton.$el.on('click',function(){
                        restoreToTop();
                    })
                    //When you click an item, go to that page, then go back, to restore proper scroll pos, it needs to
                    //be showing this button ahead of time.
                    if($scope.infinitizer.state.topArchive.length > 0){
                        loadMoreTopButton.manage();
                    }

                    var loadMoreBottomButton = new loadMoreButtonClass('after','Loading more ...','loadMoreBottom','bottomArchive');
                    





                    var restoreToTop = function(){
                        var scrollPos = $scope.infinitizer.state.scrollPos;
                        var beforeHeight = $resultsList.height();
                        // var amt = Math.min($scope.infinitizer.state.topArchive.length,numberToRequest);
                        var amt = Math.ceil(Math.min($scope.infinitizer.state.topArchive.length,maxItems/2));
                        var modulusOfAmt = amt % $scope.infinitizer.config.columns;
                        amt -= modulusOfAmt;
                        $scope.$apply(function(){
                            for(var i=0,l=amt; i<l;i++){
                                $scope.infinitizer.state.resultsArray.push($scope.infinitizer.state.topArchive[$scope.infinitizer.state.topArchive.length -1 - i]);
                            }
                            $scope.infinitizer.state.topArchive.splice($scope.infinitizer.state.topArchive.length - amt,amt);
                        });
                        

                        var afterHeight = $resultsList.height();

                        var heightDif = afterHeight - beforeHeight;

                        var toUnshift = $scope.infinitizer.state.resultsArray.splice($scope.infinitizer.state.resultsArray.length - (amt),amt);


                        $scope.$apply(function(){
                            for(var i=0,l=toUnshift.length; i<l;i++){
                            // for(var i = toUnshift.length; i--; ){ 
                                $scope.infinitizer.state.resultsArray.unshift(toUnshift[i])
                            }

                            removeFromBottom(amt);
                            changeScroll(heightDif + $scope.infinitizer.state.scrollPos);
                            // getHeights();
                        });
                        // $scrollArea.scrollTop(heightDif);
                        
                        

                    };
                    var removeFromBottom = function(amt){
                        if(amt > 0){
                            var archiveQueue = $scope.infinitizer.state.resultsArray.splice($scope.infinitizer.state.resultsArray.length - (amt),amt);
                            for(var i = archiveQueue.length; i--; ){
                                $scope.infinitizer.state.bottomArchive.unshift(archiveQueue[i])
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
                        if(typeof $scope.infinitizer.state.resultsArray === 'undefined' || $scope.infinitizer.state.resultsArray.length === 0 || needToReset){
                            timeoutMasterService.clear();
                            isRunning_restoreToBottomTimeoutRecursive = false;
                            theClone.remove()
                            theClone = $();
                            intialIsDone_fetchMoreIfNeeded = false;
                            numberToRequest = maxItems !== null ? maxItems : numberToRequest;//this gets turned to zero after...but we need a good number for restoreToBottom.
                            setupOnce_watchResultData();
                            isAtTheEndOfResponses = false;
                            wasBusy = false;

                            $scope.infinitizer.state.resultsArray = [];
                            $scope.infinitizer.state.bottomArchive = [];
                            $scope.infinitizer.state.topArchive = [];
                            loadMoreTopButton.manage();
                            restoreToBottom()
                            // restoreToBottom();

                        }
                        needToReset = false;
                    };

                    var needToReset = false;
                    var needToResetConstraints = false;
                    if(typeof $scope.infinitizer.config.resetDeterminer !== 'undefined'){
                        //when there's an ongoing async thing like a watcher, this loads ammunition that triggerering mechanism
                        $scope.infinitizer.config.resetDeterminer({
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

                    
                    
                    
                    var restoreBellowTechnique = 'recursive';

                    var isRunning_restoreToBottomTimeoutRecursive = false;
                    var maxItems = null;
                    var wasBusy = false;
                    var afterRestoreToBottom = function(){
                        var resultsArray = $scope.infinitizer.state.resultsArray;
                        if(resultsArray.length > 0 ){
                            debounceMasterService.manage('debX',function debxCb(){

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
                                    if($scope.infinitizer.state.bottomArchive.length<maxItems){
                                        fetchMoreIfNeeded();
                                    }
                                }                         
                            },0,true);
                        }
                    }
                    var restoreToBottom = function(bottomArchiveHasInitialItems){
                        console.log('restoreToBottom')
                        if(isRunning_restoreToBottomTimeoutRecursive === false){

                            if(!bottomArchiveHasInitialItems && !isAtTheEndOfResponses){

                                var amtToFetch = maxItems !== null ? maxItems - $scope.infinitizer.state.bottomArchive.length: $scope.infinitizer.config.initialFetchAmt * 2;
                                if(!fetching  && amtToFetch > 0){
                                    callEndpoint(amtToFetch,endpointCallHandler);
                                }
                            }/* else {
                                fonsole.log('bottomArchiveHasInitialItems so transfer to resultsArray')
                            }*/
                            if(maxItems !== null){
                                var amt = maxItems - $scope.infinitizer.state.resultsArray.length;
                                amt +=  amt % $scope.infinitizer.config.columns !== 0 ? $scope.infinitizer.config.columns - (amt % $scope.infinitizer.config.columns) : 0;
                                amt = amt > $scope.infinitizer.state.bottomArchive.length ? $scope.infinitizer.state.bottomArchive.length : amt;
                            } else {
                                amt = $scope.infinitizer.config.initialFetchAmt;
                            }
                            amt = amt >0 ? amt :0;
                            // var amt = $scope.infinitizer.state.bottomArchive.length < numberToRequest ? $scope.infinitizer.state.bottomArchive.length : numberToRequest;
                            // var modulusOfAmt = amt % $scope.infinitizer.config.columns;                            
                            // amt = isAtTheEndOfResponses && amt === $scope.infinitizer.state.bottomArchive.length ? amt : amt - modulusOfAmt;
                            // amt = bottomArchiveHasInitialItems && amt === 0 ? $scope.infinitizer.state.bottomArchive.length : amt; //case of 1 intial item in multi
                            if(restoreBellowTechnique === 'recursive'){
                                if(amt > 0){
                                    isRunning_restoreToBottomTimeoutRecursive = true;
                                    timeoutRecursiveService(
                                        amt,
                                        100,
                                        function(i){
                                            if($scope.infinitizer.state.bottomArchive.length > 0) {
                                                $scope.infinitizer.state.resultsArray.push($scope.infinitizer.state.bottomArchive[0]);
                                                $scope.infinitizer.state.bottomArchive.splice(0,1);
                                            } else {
                                                // $scope.resultsArrayUpdated = new Date().getTime();
                                                // afterRestoreToBottom();
                                            }
                                        },
                                        function(i){
                                            isRunning_restoreToBottomTimeoutRecursive = false;

                                            if($scope.infinitizer.state.bottomArchive.length === 0){
                                                loadMoreBottomButton.manage();
                                            } else {
                                                loadMoreBottomButton.manage();
                                            }
                                            // $scope.resultsArrayUpdated = new Date().getTime();

                                            afterRestoreToBottom();


                                            if(wasBusy === true){
                                                wasBusy = false;
                                                restoreToBottom();
                                            }

                                        }
                                    );
                                }
                            }/* else {
                                for(var i=0,l=amt; i<l;i++){
                                    $scope.infinitizer.state.resultsArray.push($scope.infinitizer.state.bottomArchive[i]);
                                }
                                $scope.infinitizer.state.bottomArchive.splice(0,amt);
                            }*/
                        } else {
                            wasBusy = true;
                        }
                    };
                                        

                    var callEndpoint = function(quantityToRetreive,cb){
                        fetching = true;
                        if(needToResetConstraints){
                            delete $scope.infinitizer.state.constraints;
                            needToResetConstraints = false;
                        }
                        if(typeof $scope.infinitizer.state.constraints === 'undefined'){
                            $scope.infinitizer.state.constraints = {offset:0};
                        }
                        $scope.infinitizer.state.constraints.limit = quantityToRetreive;
                        var hubModel = $scope.infinitizer.config.assembleHubModel($scope.infinitizer.state.constraints,$scope.infinitizer.state);
                        $scope.infinitizer.config.callEndpoint(hubModel)
                        .then(function(response){
                            var processedResults;
                            if(typeof $scope.infinitizer.config.resultPathInResponse !== 'undefined'){
                                processedResults = dhUtil.propertyAt(response,$scope.infinitizer.config.resultPathInResponse)
                            } else {
                                processedResults = response;
                            }
                            
                            if(typeof cb !== 'undefined'){
                                cb(processedResults,$scope.infinitizer.state.constraints);
                            }
                        });
                    };
                    var isAtTheEndOfResponses = false;
                    var endpointCallHandler = function(processedResults,constraints){

                        if(processedResults.length > 0){
                            for(var i =0, l = processedResults.length; i<l; i++ ){
                                $scope.infinitizer.state.bottomArchive.push(processedResults[i])
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
                            if($scope.infinitizer.state.resultsArray.length !== 0){
                                
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

                                var elmBottomPos = containerHeight ? $scope.infinitizer.state.scrollPos + containerHeight : $scope.infinitizer.state.scrollPos;
                                var heightPropertyName = $scope.infinitizer.config.name + '_LastHeight';
                                var allHeights = 0;
                                var aLength = $scope.infinitizer.state.resultsArray.length;
                                var totalCount = aLength;
                                for(var i=0,l=aLength;i<l;i++){
                                    var itemHeight = $scope.infinitizer.state.resultsArray[i][heightPropertyName];
                                    
                                    if(typeof itemHeight === 'number'){
                                        allHeights += $scope.infinitizer.state.resultsArray[i][heightPropertyName];
                                    } else {
                                        totalCount --;
                                        // log('why no height?',$scope.infinitizer.state.resultsArray[i][heightPropertyName],$scope.infinitizer.state.resultsArray[i])
                                    }

                                   
                                }

                                var averageItemHeight = (allHeights/totalCount);
                                // var averageItemHeight = ((scrollHeight-adjustment)/$scope.infinitizer.state.resultsArray.length)*$scope.infinitizer.config.columns; 
                                var verticalDownLimitScrollPos = $scope.infinitizer.config.maxScreens * containerHeight;                                
                                var scrollHeightDeficit = (verticalDownLimitScrollPos - (scrollHeight - adjustment));
                                
                                var amtItemsToFillDeficit = scrollHeightDeficit > 0 ? scrollHeightDeficit/averageItemHeight : 0;
                                amtItemsToFillDeficit = amtItemsToFillDeficit * $scope.infinitizer.config.columns;
                                amtItemsToFillDeficit = amtItemsToFillDeficit - amtItemsToFillDeficit % $scope.infinitizer.config.columns;
                                numberToRequest = Math.max(Math.ceil(amtItemsToFillDeficit),0);


                                 // * $scope.infinitizer.config.maxScreens
                                if(typeof containerHeight !== 'undefined' && averageItemHeight !== 0){

                                    var itemsPerScreenHypothetical = (containerHeight/averageItemHeight) * $scope.infinitizer.config.columns;
                                    maxItems = Math.floor(itemsPerScreenHypothetical * $scope.infinitizer.config.maxScreens);
                                    maxItems -= (maxItems % $scope.infinitizer.config.columns);
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
                                if(Math.abs(elmBottomPos-scrollHeight) < containerHeight/2 && scrollHeight/* - adjustment*/ > containerHeight && $scope.infinitizer.state.resultsArray.length >= maxItems){
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

                        var resultsArray = $scope.infinitizer.state.resultsArray;
                        var heightPropertyName = $scope.infinitizer.config.name + '_LastHeight';

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
                        var columns = $scope.infinitizer.config.columns
                        
                        for(var i=0,l=resultsArray.length; i<l; i++){
                            var user = resultsArray[i];
                            var userPos = totalHeight;
                            totalHeight = i % columns === 0 ? totalHeight + user[heightPropertyName] : totalHeight; //only the first of each row contribute to totalHeight
                            var pxAboveTop = i % columns === 0 ? ($scope.infinitizer.state.scrollPos - userPos) : previousAmountAboveTop;
                            var pxAboveTopAdjusted = pxAboveTop - adjustment;
                            var adjustedTop = $scope.infinitizer.config.preserveTopScreenAmt * containerHeight;
                            adjustedTop = Math.min(adjustedTop, $scope.infinitizer.state.scrollPos);
                            if(!destroyed || !$scope.infinitizer.config.chopTopOnDestroy){
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
                            // console.log(i,pxAboveTop + containerHeight,user,$scope.infinitizer.state.resultsArray.length)
                            if(pxAboveTop + containerHeight < adjustment){
                                losersBottom.push(user)
                            }
                            previousAmountAboveTop = pxAboveTop;
                            previousUser = user;
                        }
                        // if(losersTop[losersTop.length-1]){
                        //     console.log(losersTop[losersTop.length-1].user.basics.username)
                        // }
                        return {
                            winners:winners,
                            winnerAmountAboveTop:winnerAmountAboveTop,
                            losersTop:losersTop,
                            losersBottom: losersBottom
                        };
                    };

                    var intialIsDone_fetchMoreIfNeeded = false;
                    var ongoingWatch = 'infinitizer.state.resultsArray'
                    if(restoreBellowTechnique === 'recursive'){
                        ongoingWatch ='resultsArrayUpdated'
                    }
                    $scope.$watch(ongoingWatch,function(newData,x,y,z){
                        if(typeof newData !== 'undefined'){

                            var resultsArray = $scope.infinitizer.state.resultsArray;
                            if(resultsArray.length > 0 ){
                                debounceMasterService.manage('debXX',function debxCb(){

                                    //if a user comes up in search results with a blocked=true, splice them out.
                                    //TODO get block-user-list-update working
                                    $scope.$apply(function(){
                                        for(var i = resultsArray.length; i--; ){
                                            if(resultsArray[i].blocked){
                                                resultsArray.splice(i,1)
                                            }
                                        }
                                    });

                                    scrollHeight = $scrollArea.prop('scrollHeight');
                                    if(!scrollAreaIsElm){elmHeight = $elm.outerHeight();}
                                    containerHeight = containerHeight ? containerHeight : $scrollArea.outerHeight();
                                    if(!intialIsDone_fetchMoreIfNeeded){

                                        fetchMoreIfNeeded();
                                        intialIsDone_fetchMoreIfNeeded = true;
                                    } else {
                                        if($scope.infinitizer.state.bottomArchive.length<maxItems){
                                            fetchMoreIfNeeded();
                                        }
                                    }                         
                                },0,true);
                            }
                        }
                    },true);
                    
                    var changeScroll = function(scrollPos){
                        var adjustment = 0;
                        if($scope.infinitizer.state.topArchive.length > 0 && !loadMoreTopButton.showing){
                            loadMoreTopButton.manage();
                            adjustment = loadMoreTopButton.height;
                        } else if($scope.infinitizer.state.topArchive.length === 0 && loadMoreTopButton.showing){
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
                                        console.log('x')
                                        var scrollAmt = $scope.infinitizer.state.scrollPos;
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
                            var archiveQueue = $scope.infinitizer.state.resultsArray.splice(0,losersTop.length);
                            for(var i=0,l=losersTop.length;i<l;i++){
                                $scope.infinitizer.state.topArchive.push(losersTop[i])
                            }
                            $scope.infinitizer.state.scrollPos = winnersAndLosersObject.winnerAmountAboveTop;
                        }
                        if(losersBottom.length > 0){
                            removeFromBottom(losersBottom.length);
                        }
                        return winnersAndLosersObject;
                    };

                    

                    var theClone = $();
                    var killLosersAndAdjust = function(cb){                        
                        if(theClone.length === 0 && $scope.infinitizer.state.bottomArchive.length !== 0){
                            var cachedCb;

                            var winnersAndLosersObject = generateWinnersAndLosersObject();
                            var operation = function(itemWidth,icemanDoneWithTimeout){

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
                            };
                            var getItemHeightFun = function(i,itemArray){
                                var heightPropertyName = $scope.infinitizer.config.name + '_LastHeight';
                                return itemArray[i][heightPropertyName];
                            };
                            var getInnerWidthFun = function(){
                                return $infinitizerInner.width();
                            };
                            var icemanDoneFun = function(){
                                theClone = $();
                            };
                            var adjustmentFun = function(){
                                var adjustment = loadMoreTopButton.showing ? 2*loadMoreTopButton.height : loadMoreTopButton.height;
                                if(!scrollAreaIsElm){
                                    adjustment += (scrollHeight - elmHeight);
                                }
                                return adjustment;
                            };
                            if(winnersAndLosersObject.losersTop.length > 0){
                                cachedCb = cb;
                                theClone = icemanForScrollAdjustService($scrollArea,$scope.infinitizer.state.resultsArray,getItemHeightFun,getInnerWidthFun,'.infinitizerItem','.infinitizerInner',operation,containerHeight,'100%',scrollHeight,elmHeight,$scope.infinitizer.state.scrollPos,icemanDoneFun,adjustmentFun,$scope.infinitizer.config.columns);
                            }
                        }
                        //Create clone of the scrollElm.  Plop it on top.  Them perform scrollbust overflow manipulation on original.
                        //This hides a visible flash that scroll busting causes.
                    };

                    var hasTouch = false;
                    
                    $scrollArea.on('touchstart',function(e){
                        hasTouch = true;
                    });
                    var debOld = debounceService(100);
                    $scrollArea.on('scroll',function(e){
                        console.log('scroll')
                        $scope.infinitizer.state.scrollPos = dhUtil.getYOffset($scrollArea);
                        var deb = debounceMasterService.manage('scrollDeb',function(){
                            fetchMoreIfNeeded();
                        },100,true);   
                        // debOld.reset(function(){
                        //     console.log('S');
                        //     fetchMoreIfNeeded();
                        // });
                        // timeoutMasterService.manage(debOld.timeout);
                    });

                    $scope.$on('$destroy',function(){
                        destroyed = true;
                        generateWinnersAndLosersObject_thenProcessStateArrays()
                        timeoutMasterService.clear();
                    })
                })
            }


        };
    }]);
}]);})(app);