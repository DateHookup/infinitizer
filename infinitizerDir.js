
var infinitizerModule = (function(){
    var infinitizerModule = angular.module('infinitizerModule', []);

    var DhUtil = function() {
        this.validation = new validation();
    };

    DhUtil.prototype.getYOffset = function($el) {
        var posY;
        if (typeof $el === 'undefined' || $el === window) {
            if (typeof(window.pageYOffset) == 'number') {
                posY = window.pageYOffset;
            } else {
                posY = document.documentElement.scrollTop;
            }
        } else {
            posY = $el[0].scrollTop;
        }
        return posY;
    };
    DhUtil.prototype.propertyAt = function index(objx, at, value) {
        //when assigning values, if there is a long object chain desired, if that chain doesn exist, it will be created.
        if (typeof at == 'string') {
            at = at.replace(/\[(\w+)\]/g, '.$1');

            return index(objx, at.split('.'), value);

        } else if (at.length == 1 && value !== undefined) {
            return objx[at[0]] = value;
        } else if (at.length == 0) {
            return objx;
        } else {
            if (typeof objx[at[0]] === 'undefined') {
                objx[at[0]] = {};
            }
            return index(objx[at[0]], at.slice(1), value);
        }
    }

    dhUtilMini = new DhUtil();



    infinitizerModule.factory('icemanForScrollAdjustService', ['timeoutMasterService', function (timeoutMasterService) {

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
                
                settings.$scrollArea.off('scroll.iceLock');
                settings.icemanDoneFun();
                clone.css({'opacity':0});
                timeoutMasterService.manage(function(){
                    clone.remove();
                },0)['catch'](function(){clone.remove()});
            };

            timeoutMasterService.manage(function(){
                settings.operation(innerWidth,function(icemanDoneCb){
                    timeoutMasterService.manage(finishedFun,0)['catch'](finishedFun);
                });
            },100)['catch'](finishedFun);

            return clone
        };
    }]);


    
    infinitizerModule.directive(
        'infiniteScrollItemDir', ['screenReadyService','windowService',function(screenReadyService,windowService){
            return function($scope, $elm, attrs) {
                // console.log($scope.$index)
                if($scope.infinitizer.config.magicColumns){
                    $scope.$watch('$index',function(n){
                        // console.log(n)
                    })
                    $elm.find('.testItem').height(Math.floor(Math.random() *100));

                }

                if($scope[$scope.infiniteScrollScope.itemName]){
                    var doIt = function(){
                        var thisItemHeight = $elm.outerHeight(true)
                        $scope[$scope.infiniteScrollScope.itemName][$scope.infinitizer.config.name + '_LastHeight'] = thisItemHeight;
                        var thisItemWidth = $scope.infinitizer.config.magicColumns ? $elm.outerWidth(true) : null;
                        $scope[$scope.infiniteScrollScope.itemName][$scope.infinitizer.config.name + '_LastWidth'] = thisItemWidth;
                        


                        if($scope.infinitizer.config.magicColumns){
                            var columnIndex = $scope.$index % $scope.infinitizer.config.columns;


                            var leftNeighborColumn = $scope.infinitizer.config.magicColumns[columnIndex - 1];
                            var specsOfLeftNeighbor = leftNeighborColumn ? leftNeighborColumn.previousItemSpecs : null;

                            var thisColumn = $scope.infinitizer.config.magicColumns[columnIndex];
                            $scope.infinitizer.config.magicColumns[columnIndex] = thisColumn ? thisColumn : {
                                totalDeficit:0,
                                realItemSumTotalHeight:0
                            };
                            thisColumn = $scope.infinitizer.config.magicColumns[columnIndex];

                            thisColumn.realItemSumTotalHeight = thisColumn.realItemSumTotalHeight + thisItemHeight;
                            var needsUlResize = false;


                            var currentShortest = Infinity;


                            for(var i=0,l=$scope.infinitizer.config.magicColumns.length;i<l;i++){
                                if(currentShortest > $scope.infinitizer.config.magicColumns[i].realItemSumTotalHeight){
                                    currentShortest = $scope.infinitizer.config.magicColumns[i].realItemSumTotalHeight;
                                    needsUlResize = true;
                                }
                            }

                            

                            specsOfTopNeighbor = thisColumn ? thisColumn.previousItemSpecs : null;

                            var thisItemSpecs = {
                                index:$scope.$index,
                                height:thisItemHeight
                            };

                            var realColumnHeight = thisColumn.realItemSumTotalHeight;


                            var previousColumnHeight = $scope.infinitizer.config.previousColumnHeight ? $scope.infinitizer.config.previousColumnHeight : Infinity;
                            $scope.infinitizer.config.previousColumnHeight = realColumnHeight;

                            if(needsUlResize ){
                                $elm.closest('.infinitizerResults').css({
                                    height:currentShortest,
                                    overflow:'hidden'
                                })
                            }



                            


                            thisColumn.previousTotalDeficit = thisColumn.totalDeficit;
                            
                            var updateAfter = false;
                            if(specsOfTopNeighbor){
                                $elm.css({
                                    'position':'relative',
                                    'top':thisColumn.totalDeficit
                                })
                            }
                            if(specsOfLeftNeighbor){
                                var diffToLeft = specsOfLeftNeighbor.height - thisItemSpecs.height;

                                if(diffToLeft > 0 ){
                                    thisItemSpecs.height = specsOfLeftNeighbor.height;
                                    $elm.height(specsOfLeftNeighbor.height);
                                    thisItemSpecs.rowHeightDeficit = diffToLeft;
                                    thisColumn.totalDeficit -= diffToLeft;
                                } else {
                                    for(var i = 0; i < columnIndex; i++){
                                        var leftwardColumn  = $scope.infinitizer.config.magicColumns[i];
                                        var leftwardColumnPreviousItemSpecs  = $scope.infinitizer.config.magicColumns[i].previousItemSpecs;
                                        var previousLeftwardTotalDeficit = leftwardColumn.totalDeficit;
                                        leftwardColumn.totalDeficit = leftwardColumn.totalDeficit ? leftwardColumn.totalDeficit +  diffToLeft: diffToLeft;
                                        var deficitDiff = previousLeftwardTotalDeficit - leftwardColumn.totalDeficit;
                                        leftwardColumnPreviousItemSpecs.height -= deficitDiff;
                                    }                                    
                                }
                            }


                            $scope.infinitizer.config.magicColumns[columnIndex].previousItemSpecs = thisItemSpecs;



                           

                        }
                    };
                    screenReadyService(doIt);
                    windowService.onResize(doIt,$scope)
                }

            };g
        }]
    );
    infinitizerModule.directive( 'transcope', function() {
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

    infinitizerModule.directive(
        //http://stackoverflow.com/a/14426540/1242000
        'infinitizerDir', [
            '$parse',
        function(
            $parse
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
                    '<div ng-if="!infinitizer.fetching && infinitizer.state.resultsArray.length == 0 && infinitizer.state.bottomArchive.length == 0 && infinitizer.state.topArchive.length == 0" class="scrollRepeatStatus scrollRepeatStatusEmpty">None at this time.</div>' +
                    '<ul class="infinitizerResults">'+
                        '<li class="infinitizerItem" infinite-scroll-item-dir transcope  >'+
                        '</li>'+
                    '</ul>'+
                '</div>'
            }
        }]
    );

    
    infinitizerModule.factory('infinitizerCacheService', [function () {

        var Obj = function(){
            this.cache = {};
            this.families = {};
        };
        Obj.prototype.getCache = function(name){
            if(typeof this.cache[name] === 'undefined'){
                this.cache[name] = {};
                this.cache[name].scrollPos = 0;
                this.cache[name].topArchive = [];
                this.cache[name].resultsArray = [];
                this.cache[name].bottomArchive = [];
            }
            return this.cache[name];
        };

        Obj.prototype.iterateArchive = function(cacheName,archiveName,findFun){
            var pageCache = this.getCache(cacheName);
            var someArchive = pageCache[archiveName];
            var doBreak = false;
            var doBreakFun = function(){
                doBreak = true;
            }
            for(var i=0,l=someArchive.length; i<l;i++){
                findFun(i,cacheName,archiveName,someArchive,doBreakFun);
                if(doBreak){
                    break;
                }
            }
        };
        Obj.prototype.familyAdopt = function(familyName,infinitizerName){
            if(typeof this.families[familyName] === 'undefined'){
                this.families[familyName] = {};
            }

            this.families[familyName][infinitizerName] = true;
        };

        Obj.prototype.wipeFamily = function(familyName){
            for(var cacheName in this.families[familyName]){
                delete this.cache[cacheName];
            }
        };



        Obj.prototype.iterateCache = function(cacheName,findFun){
            var self = this;
            var pageCache = this.getCache(name);
            var archives = [
                'topArchive',
                'resultsArray',
                'bottomArchive'
            ];

            for(var i=0,l=archives.length; i<l;i++){
                this.iterateArchive(cacheName,archives[i],findFun);
            }
        };




        Obj.prototype.nuke = function(){
            this.cache = {};
            this.families = {};
        };


        return new Obj();

        
    }]);

    infinitizerModule.factory('makeStatusDisplayService', ['debounceMasterService', function (debounceMasterService) {
        return function($scope,$resultsList,restoreToTop,$scrollRepeatStatusInitializing){
            var state = $scope.infinitizer.state;
            var config = $scope.infinitizer.config;


            var debHelper = function(name,button,operation){
                operation = operation ? operation : function(){};
                button.deb = debounceMasterService.manage(name,operation,1000,true,$scope);
                return button.deb
            };

            var loadMoreButtonClass = function(placement,text,className,arrayName,alwaysInstant){
                this.alwaysInstant = !!alwaysInstant;
                this.className = className;
                this.$el = $('<div class="'+className+' scrollRepeatStatus hidden">'+text+'</div>');
                this.showing = false;
                $resultsList[placement](this.$el);
                this.height = this.$el.outerHeight();
                this.arrayName = arrayName;
                this.deb = {
                    debounce:{
                        def:{
                            reject: function(){}
                        },
                        reset:function(){}
                    }
                }
            };



            loadMoreButtonClass.prototype.show = function(){
                var self = this;
                var doIt = function(){
                    self.showing = true;
                    self.$el.removeClass('hidden');
                };
                if(!this.showing){
                    if(this.alwaysInstant){
                        doIt();
                    } else{
                        var debName = 'show_'+this.className+'_'+config.name+'_'+this.className;
                        debHelper(debName,this,function debxCb(){
                            doIt();                                            
                        })                                        
                    }
                }                                
            };
            loadMoreButtonClass.prototype.hide = function(){
                var self = this;
                if(this.showing){

                    this.$el.addClass('hidden');
                    if(!this.alwaysInstant){

                        var debName = 'show_'+this.className+'_'+config.name+'_'+this.className;
                        debHelper(debName,this);
                        
                    }
                    this.showing = false;
                }
            };


            var loadMoreTopButton = new loadMoreButtonClass('before','Load previous','scrollRepeatStatusShowPrevious','topArchive',true);
            loadMoreTopButton.$el.on('click',function(){

                restoreToTop();
            })

            var loadMoreBottomButton = new loadMoreButtonClass('after','Loading more ...','scrollRepeatStatusLoadingBelow','bottomArchive');

            var endOfResultsButton = new loadMoreButtonClass('after','End of results','scrollRepeatStatusEnd','bottomArchive',true);


            var loadingMoreInitialIsDone = false;
            var loadingMoreInitialDone = function(){
                if(!loadingMoreInitialIsDone && $scope.infinitizer.state.resultsArray.length > 0){
                    loadingMoreInitialIsDone = true;
                    $scrollRepeatStatusInitializing.addClass('hidden');
                }
            };

            var endOfResultsButtonManage = function(){
                if(state.bottomArchive.length === 0 && $scope.isAtTheEndOfResponses){
                   endOfResultsButton.show(); 
                } else {
                    endOfResultsButton.hide(); 
                }
            };
            var loadMoreTopButtonManage = function(){
                if(state.topArchive.length !== 0){
                    loadMoreTopButton.show();
                } else {
                    loadMoreTopButton.hide();
                }
            };

            var loadMoreBottomButtonManage = function(){
                var self = this;
                if(state.bottomArchive.length === 0 && $scope.isAtTheEndOfResponses){
                    var debName = 'show_'+loadMoreBottomButton.className+'_'+config.name+'_'+loadMoreBottomButton.className;
                    debHelper(debName,self)
                    loadMoreBottomButton.hide(88);
                } else {
                    loadMoreBottomButton.show('bottom');
                }
            };

            var allButtonsManage = function(){
                loadingMoreInitialDone();
                endOfResultsButtonManage();
                loadMoreTopButtonManage();
                loadMoreBottomButtonManage();
            };





            allButtonsManage();
            return {
                loadMoreBottomButton:loadMoreBottomButton,
                loadMoreTopButton:loadMoreTopButton,
                allButtonsManage:allButtonsManage
            }
        };  
    }]);


    



    infinitizerModule.directive(
        'infiniteScrollDir', [
            'screenReadyService','debounceMasterService','timeoutMasterService','icemanForScrollAdjustService','timeoutRecursiveService','windowService','infinitizerCacheService','$rootScope','$timeout','debounceService','makeStatusDisplayService',
        function(
            screenReadyService,debounceMasterService,timeoutMasterService,icemanForScrollAdjustService,timeoutRecursiveService,windowService,infinitizerCacheService,$rootScope,$timeout,debounceService,makeStatusDisplayService
        ){


        return {
            controller: ['$scope',function($scope){
                $scope.infiniteScrollScope = $scope;
                $scope.scrollPos = 0;

                var bootstrap = function(){
                    var once = $scope.$watch($scope.pageName + '_infinitizer', function(infinitizerSettingsFromCtrl){
                        if(infinitizerSettingsFromCtrl){
                            once();
                            if(typeof $scope.$widgetScope !== 'undefined'){
                                $scope.$widgetScope.infinitizer = {};
                            } else {
                                $scope.infinitizer = {};
                            }
                            
                            $scope.infinitizer.state = infinitizerCacheService.getCache(infinitizerSettingsFromCtrl.name);
                            $scope.infinitizer.config = infinitizerSettingsFromCtrl;
                            $scope.infinitizer.config.blockFilter = $scope.infinitizer.config.blockFilter ? $scope.infinitizer.config.blockFilter : function(){return false;}; 
                            $scope.infinitizer.config.columns = typeof $scope.infinitizer.config.columns !== 'undefined' ? $scope.infinitizer.config.columns : 1;
                            if($scope.infinitizer.config.columns === 'magic'){
                                $scope.infinitizer.config.columns = 1;
                                $scope.infinitizer.config.magicColumns = [];
                            } else {
                                 $scope.infinitizer.config.magicColumns = false;
                            }

                            var state = $scope.infinitizer.state;
                            

                            $scope.infinitizer.purgeBlocked = function(){
                                for(var i = state.resultsArray.length; i--; ){
                                // for(var i=0,l=state.resultsArray.length;i<l;i++){
                                    if($scope.infinitizer.config.blockFilter(state.resultsArray[i])){
                                        state.resultsArray.splice(i,1);
                                    }
                                }
                            };
                            $scope.infinitizer.purgeBlocked();
                            $scope.infintizerReady = true;
                        }
                    });
                };

                $scope.infintizerReady = false;

                screenReadyService(function(){
                    if($scope.closestAnimInfo_enter && true){
                        $scope.$watch('closestAnimInfo_enter.status',function(n){
                            if(n === 'ended'){
                                bootstrap();
                            }
                        })
                    } else {
                        bootstrap();
                    }
                });
                    
                
                

            }],
            link:function($scope, $elm, attrs) {

                // var xxx  = $timeout(function(x){
                //     console.log('good',x)
                // },100);
                // console.log(xxx)
                // xxx['catch'](function(x){
                //     console.log('bad',x)
                // });
                var $scrollArea = $elm.closest('.scrollArea');
                var $scrollRepeatStatusInitializing = $('<div class="scrollRepeatStatusInitializing scrollRepeatStatus">LOADING</div>');
                $scrollArea.before($scrollRepeatStatusInitializing);


                var onceReady = $scope.$watch('infintizerReady',function(n){
                    if(n){
                        onceReady();
                    
                        $elm.addClass('infinitizer');
                        $elm.wrapInner('<div class="infinitizerInner"></div>');
                        var $infinitizerInner = $elm.find('.infinitizerInner');

                        
                        
                        var resetCleanup = function(){};
                        screenReadyService(function(){
                            var state = $scope.infinitizer.state;
                            var config = $scope.infinitizer.config;


                            //the scrollArea can be outside the $elm.  
                            //Like if there's non infinitizer content above the infinitizer content. like on home.
                            
                            var scrollAreaIsElm = $scrollArea[0] === $elm[0];
                            var $resultsList = $scrollArea.find('.infinitizerResults');
                            if(config.columns > 1 || config.magicColumns){
                                $resultsList.addClass('clearfix');
                            }
                            $resultsList.css('z-index',1)
                            //to make z-index effective against invisilbe loadMoreButton click
                            $resultsList.css('position','relative');
                            $scrollArea.css('position','relative');

                            

                            $scope.infinitizer.fetching = false;
                            var containerHeight;
                            var numberToRequest = config.initialFetchAmt;
                            numberToRequest += numberToRequest % config.columns;




                            
                            

                            var iceManHelper = function(doThis){
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
                                        // return $infinitizerInner.width();
                                        return '100%';
                                    },
                                    getItemHeightFun:function(i,itemArray){
                                        var heightPropertyName = config.name + '_LastHeight';
                                        return itemArray[i][heightPropertyName];
                                    },
                                    getAdjustment:function(){
                                        var adjustment = statusDisplays.loadMoreTopButton.showing ? 2*statusDisplays.loadMoreTopButton.height : statusDisplays.loadMoreTopButton.height;
                                        if(!scrollAreaIsElm){
                                            adjustment += (scrollHeight - elmHeight);
                                        }
                                        return adjustment;
                                    }, 
                                    operation:function(itemWidth,icemanDoneWithTimeout){
                                        doThis.apply(null,arguments)
                                    },
                                    
                                                                       
                                });
                            };

                            var restoreToTop = function(){

                                










                                //==========
                                //==========

                                iceManHelper(function(itemWidth,icemanDoneWithTimeout){

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
                                        screenReadyService(function(){
                                            
                                            icemanDoneWithTimeout();
                                            
                                        });
                                    });
                                });


                                //==========
                                //==========
                            };


                            var statusDisplays = makeStatusDisplayService($scope,$resultsList,restoreToTop,$scrollRepeatStatusInitializing);
                            /*
                                {
                                    loadMoreBottomButton:loadMoreBottomButton,
                                    loadMoreTopButton:loadMoreTopButton,
                                    allButtonsManage:allButtonsManage
                                }
                            */
                            var removeFromBottom = function(amt){
                                if(amt > 0){
                                    var archiveQueue = state.resultsArray.splice(state.resultsArray.length - (amt),amt);
                                    for(var i = archiveQueue.length; i--; ){
                                        state.bottomArchive.unshift(archiveQueue[i]);
                                    }
                                    if(!destroyed){
                                    statusDisplays.allButtonsManage();
                                    }
                                }
                            };
                            
                            $scope.infinitizer.reset = function(maybePullToRefreshCleanerUpper){
                                resetCleanup = maybePullToRefreshCleanerUpper ? maybePullToRefreshCleanerUpper : resetCleanup;
                                needToReset = true;
                                needToResetConstraints = true;
                                resetOrRestoreResults();
                                
                            };

                            var resetOrRestoreResults = function(){
                                if(
                                    typeof state.resultsArray === 'undefined' || 
                                    state.resultsArray.length === 0 || 
                                    needToReset
                                ){
                                    console.log('clear 1')
                                    timeoutMasterService.clear();
                                    isRunning_restoreToBottomTimeoutRecursive = false;
                                    theClone.remove();
                                    theClone = $();
                                    intialIsDone_fetchMoreIfNeeded = false;
                                    numberToRequest = maxItems !== null ? maxItems : numberToRequest;//this gets turned to zero after...but we need a good number for restoreToBottom.
                                    setupOnce_watchResultData();
                                    $scope.isAtTheEndOfResponses = false;
                                    wasBusy = false;
                                    needsWidthAdjust = true;

                                    state.resultsArray = [];
                                    state.bottomArchive = [];
                                    state.topArchive = [];
                                    statusDisplays.allButtonsManage(true);
                                    restoreToBottom();

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
                                        statusDisplays.allButtonsManage()
                                        // console.log(state.resultsArray.length)                       
                                    },0,true,$scope);

                                }
                            }
                            var restoreToBottom = function(bottomArchiveHasInitialItems){
                                if(isRunning_restoreToBottomTimeoutRecursive === false){
                                    

                                    if(!bottomArchiveHasInitialItems && !$scope.isAtTheEndOfResponses){

                                        var amtToFetch = maxItems !== null ? maxItems - state.bottomArchive.length: config.initialFetchAmt * 2;
                                        if(!$scope.infinitizer.fetching  && amtToFetch > 0){
                                            callEndpoint(amtToFetch,endpointCallHandler);
                                        }
                                    }/* else {
                                        console.log('bottomArchiveHasInitialItems so transfer to resultsArray')
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
                                    if(amt > 0){

                                        resetCleanup();
                                        resetCleanup = function(){};

                                        isRunning_restoreToBottomTimeoutRecursive = true;
                                        statusDisplays.allButtonsManage();


                                        var doSimpleWay = true;

                                        var simpleWay = function(){
                                            for(var i=0,l=amt; i<l;i++){
                                                // console.log($scope.infinitizer.state.bottomArchive[i].basics.username)
                                                state.resultsArray.push($scope.infinitizer.state.bottomArchive[i]);
                                            }
                                            $scope.infinitizer.state.bottomArchive.splice(0,amt);

                                            statusDisplays.allButtonsManage();

                                            isRunning_restoreToBottomTimeoutRecursive = false;

                                            
                                            afterRestoreToBottom();

                                            if(wasBusy === true){
                                                wasBusy = false;
                                                restoreToBottom();
                                            }
                                        };
                                        
                                        var complexWay = function(){

                                            var idealChunkAmt = 8;
                                            
                                            var oldWay = false;
                                            var waitAmt = oldWay ? 0 : 2000;

                                            timeoutRecursiveService(
                                                Math.ceil(amt/idealChunkAmt),
                                                waitAmt,
                                                true,
                                                function(i){




                                                    if(state.bottomArchive.length > 0) {

                                                        if(oldWay){
                                                            if(!config.blockFilter(state.bottomArchive[0])){
                                                                state.resultsArray.push(state.bottomArchive[0]);
                                                            }
                                                            state.bottomArchive.splice(0,1);
                                                        } else {

                                                            var realChunkAmt = state.bottomArchive.length >= idealChunkAmt ? idealChunkAmt : state.bottomArchive.length;
                                                            for(var i=0; i<realChunkAmt;i++){
                                                                if(!config.blockFilter(state.bottomArchive[0])){
                                                                    state.resultsArray.push(state.bottomArchive[0]);
                                                                }
                                                                state.bottomArchive.splice(0,1);
                                                            }
                                                        }
                                                        
                                                    }

                                                    statusDisplays.allButtonsManage();

                                                    
                                                },
                                                function(i){
                                                    isRunning_restoreToBottomTimeoutRecursive = false;

                                                    statusDisplays.allButtonsManage();

                                                    afterRestoreToBottom();

                                                    if(wasBusy === true){
                                                        wasBusy = false;
                                                        restoreToBottom();
                                                    }
                                                }
                                            );
                                        };


                                        if(doSimpleWay){
                                            simpleWay();
                                        } else {
                                            complexWay();
                                        }

                                    } else {
                                        if(typeof containerHeight === 'undefined'){
                                            afterRestoreToBottom();
                                        }
                                        resetCleanup();
                                        resetCleanup = function(){};
                                    }
                                } else {
                                    wasBusy = true;
                                }
                            };
                                                

                            var callEndpoint = function(quantityToRetreive,cb){
                                $scope.infinitizer.fetching = true;
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
                            $scope.isAtTheEndOfResponses = false;


                            

                            var endpointCallHandler = function(processedResults,constraints){

                                if(processedResults.length > 0){
                                    for(var i =0, l = processedResults.length; i<l; i++ ){
                                        state.bottomArchive.push(processedResults[i])
                                    }
                                    statusDisplays.allButtonsManage();
                                    constraints.offset = constraints.offset + processedResults.length;
                                    screenReadyService(function endpointCallHandlerscreenReadyService(){
                                        $scope.infinitizer.fetching = false;
                                        fetchMoreIfNeeded();
                                    })
                                } else {
                                    console.log('SERVER RESPONDED WITH ZERO RESULTS');
                                    $scope.infinitizer.fetching = false;
                                    $scope.isAtTheEndOfResponses = true;
                                    statusDisplays.allButtonsManage();

                                    
                                }                     
                            };
                            needsWidthAdjust = true;
                            if(config.magicColumns){
                                windowService.onResize(function(){
                                    var deb = debounceMasterService.manage('resizeDeb'+config.name,function(){
                                        needsWidthAdjust = true;
                                        fetchMoreIfNeeded();
                                    },1000,true,$scope);   
                                },$scope);
                            }
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
                                        adjustment += statusDisplays.loadMoreTopButton.showing ? statusDisplays.loadMoreTopButton.height : 0;
                                        adjustment += statusDisplays.loadMoreBottomButton.showing ? statusDisplays.loadMoreBottomButton.height : 0;

                                        scrollHeight = $scrollArea.prop('scrollHeight');
                                        if(!scrollAreaIsElm){elmHeight = $elm.outerHeight();}
                                        if(config.magicColumns && needsWidthAdjust){
                                            var infinitizerInnerWidth = $infinitizerInner.width();
                                            var widthPropertyName = config.name + '_LastWidth';
                                        }

                                        var elmBottomPos = containerHeight ? state.scrollPos + containerHeight : state.scrollPos;
                                        var heightPropertyName = config.name + '_LastHeight';
                                        
                                        var allHeights = 0;
                                        var aLength = state.resultsArray.length;
                                        var totalCount = aLength;
                                        for(var i=0,l=aLength;i<l;i++){
                                            var itemHeight = state.resultsArray[i][heightPropertyName];
                                            var itemWidth = state.resultsArray[i][widthPropertyName];
                                            if(config.magicColumns && needsWidthAdjust){
                                                needsWidthAdjust = false;
                                                config.columns = Math.floor((infinitizerInnerWidth) /(itemWidth - 1));
                                            }
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

                                        if(typeof containerHeight !== 'undefined' && averageItemHeight !== 0){
                                            var itemsPerScreenHypothetical = (containerHeight/averageItemHeight) * config.columns;
                                            maxItems = Math.floor(itemsPerScreenHypothetical * config.maxScreens);
                                            maxItems -= (maxItems % config.columns);
                                        }
                                        
                                        if(
                                            Math.abs(elmBottomPos-scrollHeight) < containerHeight/2 && 
                                            scrollHeight > containerHeight && 
                                            state.resultsArray.length >= maxItems
                                        ){
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
                                var adjustment = statusDisplays.loadMoreTopButton.showing ? statusDisplays.loadMoreTopButton.height : 0;

                                adjustment += !scrollAreaIsElm ? (scrollHeight - elmHeight) : adjustment;

                                var columns = config.columns;
                                var columnTotalHeights;
                                if(config.magicColumns){
                                    columnTotalHeights = [];
                                }
                                for(var i=0,l=resultsArray.length; i<l; i++){



                                    var columnIndex = i % columns;
                                    var user = resultsArray[i];
                                    var userPos = totalHeight;




                                    //only the first of each row contribute to totalHeight
                                    totalHeight = columnIndex === 0 ? totalHeight + user[heightPropertyName] : totalHeight; 

                                    if(config.magicColumns){
                                        userPos = columnTotalHeights[columnIndex] ? columnTotalHeights[columnIndex] : 0;

                                        columnTotalHeights[columnIndex] = columnTotalHeights[columnIndex] ? columnTotalHeights[columnIndex] : 0;
                                        columnTotalHeights[columnIndex] += user[heightPropertyName];

                                        totalHeight = columnTotalHeights[columnIndex];
                                    }


                                    var pxAboveTop = columnIndex === 0 ? (state.scrollPos - userPos) : previousAmountAboveTop;
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
                                                if(config.magicColumns){
                                                    // console.log(columns - columnIndex)
                                                } else {
                                                    firstPlaceWinner = previousUser;
                                                    winnerAmountAboveTop = previousAmountAboveTop;
                                                    // for(var i = columns; i--; ){
                                                    for(var ii=0,ll=columns;ii<ll;ii++){
                                                        var poppedItem = losersTop.pop();;
                                                        winners.unshift(poppedItem);
                                                        
                                                    }
                                                }
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

                                if(state.topArchive.length > 0 && !statusDisplays.loadMoreTopButton.showing){
                                    statusDisplays.allButtonsManage();
                                    adjustment = statusDisplays.loadMoreTopButton.height;
                                } else if(state.topArchive.length === 0 && statusDisplays.loadMoreTopButton.showing){
                                    statusDisplays.allButtonsManage();
                                    adjustment = -statusDisplays.loadMoreTopButton.height;
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
                                        iceManHelper(function(itemWidth,icemanDoneWithTimeout){

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
                                                                               

                                        });
                                    }
                                }
                                //Create clone of the scrollElm.  Plop it on top.  
                                //Then perform scrollbust overflow manipulation on original.
                                //This hides a visible flash that scroll busting causes.
                            };

                            // $scrollArea.on('touchstart',function(e){
                            //     console.log('touchstart');
                            // });
                            // $scrollArea.on('touchmove',function(e){
                            //     console.log('touchmove');
                            // });
                            // $scrollArea.on('touchend',function(e){
                            //     console.log('touchend');
                            // });
                            // $scrollArea.on('touchcancel',function(e){
                            //     console.log('touchcancel');
                            // });
                            // $scrollArea.on('scrollend',function(e){
                            //     console.log('scrollend');
                            // });
                            /*var debasdf = debounceService(1000);
                            $scrollArea.on('scroll',function(e){
                                debasdf.reset(function(){
                                    console.log('---------------- primitive execute')
                                })  
                                var deb = debounceMasterService.manage('master',function(){
                                    console.log('------------------ master execute')
                                },1000,true,$scope); 
                            });
                            */
                            $scrollArea.on('scroll',function(e){
                                window.lastScrollTime = new Date();
                                state.scrollPos = dhUtil.getYOffset($scrollArea);
                                var deb = debounceMasterService.manage('scrollDeb_'+config.name,function(){
                                    fetchMoreIfNeeded();
                                },100,true,$scope);   
                            });

                            $scope.$on('$destroy',function(){
                                destroyed = true;

                                var startingTopArchiveLength = state.topArchive.length;
                                generateWinnersAndLosersObject_thenProcessStateArrays();
                                var endingTopArchiveLength = state.topArchive.length;
                                if(startingTopArchiveLength === 0 && endingTopArchiveLength !== 0){
                                    //when no topLoadingButton before destroy, 
                                    //but chopTopOnDestroy yields toLoadingButton when returning to infinitizer
                                    state.scrollPos += statusDisplays.loadMoreTopButton.height;
                                }
                                timeoutMasterService.clear();
                            })
                        })
                    }
                });
            }



        };
    }]);


    return infinitizerModule;
})();
/* ... if(winnersAndLosersObject.losersTop.length > 0){
    ... var technique = 'overflow';
    ... if(technique === 'overflow'){
        // ...
    }else{
        //After calculating the resultsArray and new scrollPos, I run $apply to tell angular to update DOM
        //Immediately after this I apply translate3D offset to compensate for the removed items.
        //I don't want this translate3D to batch with subsequent DOM manipulation calls.
        //So I query the dome with $scrollArea.height().  This prevents batching.
        //Then I scroll and un-compenste the translate 3d.
        //Then I remove translate3d because it makes things wonky.
        $scope.$apply(function(){//
            $resultsList.css({
                translate3d:[0,-(winnersAndLosersObject.winnerAmountAboveTop - $scope.infinitizer.state.scrollPos),0]
            })
        })
        var why = $scrollArea.height();//Throwing in a DOM lookup seems to break event cue's DOM manipulation reflow batching.
        
        $resultsList.css({//iosJankFree step 2
            translate3d:[0,0,0]
        });
        changeScroll(winnersAndLosersObject.winnerAmountAboveTop)
        // $scrollArea.scrollTop(winnersAndLosersObject.winnerAmountAboveTop);

        screenReadyService(function(){
            $resultsList.css({ //iosJankFree step 2 //this configuration of translate3d is necessary for jank free iOs
                translate3d:''
            });
            // fetchMoreIfNeeded();
        })
    }
        
    ... if(cachedCb){
    ...    cachedCb()
    ... }
    
}
*/



/*var failSafe = null;
var cancelFailSafe = function(){
    if(failSafe !== null){
        $interval.cancel(failSafe);
        failSafe = null;
    }
};*/


/*failSafe = $interval(function(){gg
    if($scope.infinitizer.state.resultsArray.length >0){
    var bottomOfScrollMinusBottomOfContainer = (scrollHeight-containerHeight) - $scope.infinitizer.state.scrollPos;
    // console.log('interval',bottomOfScrollMinusBottomOfContainer)
    if(bottomOfScrollMinusBottomOfContainer < 100){
        console.log('GOTCHA!')
        fetchMoreIfNeeded();
        // killLosersAndAdjust_withDebounce();
        $interval.cancel(failSafe);
        failSafe = null;
    }
    }
},1000)*/