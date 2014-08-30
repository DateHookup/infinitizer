define(['ang/app','dhUtil'], function (app,dhUtil) {
    app.register.controller('searchCtrl', [
        '$scope','hubConnectionService','$rootScope','dictService','$location','entityCacheService','pageDataCacheService','searchEndpointService','$interval',
        function($scope,hubConnectionService,$rootScope,dictService,$location,entityCacheService,pageDataCacheService,searchEndpointService,$interval){
            $scope.widgetNamespace = $scope.$id;
            $scope.$widgetScope = $scope;

            $scope.dictService = dictService;
            
            $scope.counter = 0;
            


            // If there is a url search parameter of "latest" then set search setting to "latest",
            var routingShowLatest = false;
            if($location.search().latest){
                //cancel out the search param in the url bar
                $location.url($location.path(),true);
                $location.replace();
                
                if($rootScope.searchParamsSettings){
                    //If search setting have already been initialized
                    $rootScope.searchParamsSettings.SearchType = dictService.numberLeaf.SearchType['online now'];
                } else {
                    //Search setting not intialized.  That init will be called further down.
                    //this is a flag that will affect initialization.
                    routingShowLatest = true;
                }

                // $location.search('latest',null,{replace:true})
            }

            
            




            $scope.test = function(){
                console.log('test')
            };


            if(typeof $rootScope.deathrow.profileSettings.searchTimestamp === 'undefined'){
                //either first time or needing reset because profile settings changed
                var now = new Date().getTime();
                $rootScope.deathrow.profileSettings.searchTimestamp = now;
                delete $scope.searchParamsSettings;
            }


            
            /*infiniteScrollService({
                $scope: $scope,
                scopeResultsArrayName: 'searchResults',
                pageName: 'search',
                assembleHubModel :function(cachedConstraints){
                    var constraints= {};
                    constraints['result.userSearchResults'] = cachedConstraints;
                    return {
                        name:'LegacyQuickSearch',
                        params:[
                            $rootScope.searchParamsSettings,
                        ],
                        constraints: constraints
                    };
                },
                resetDeterminer: function(cbs){
                    $scope.$watch('searchParamsSettings',function(newValue){
                        if(typeof newValue === 'undefined'){
                            searchEndpointService.initsearchParamsSettings('searchParamsSettings',routingShowLatest);
                            cbs.reInit();
                            cbs.reConstraints()
                            // console.log('1a. resetDeterminer reInit')
                        } else {
                            cbs.reConstraints()
                            //when those params settings are updated, they are no longer undefined
                            //and we call the function below.
                            cbs.resetOrRestorResults();
                            // console.log('1b. resetDeterminer resetOrRestorResults')
                        }
                    },true); 
                },
                numberToRequest:3,
                numberOfScreensWorthOfItemsForMax: 12,
                numberOfScreensWorthOfItemsToRequest: 2,
                numberOfContainerHeightsBeforeFetching: 4,
                initializeParamsExternally: function(){searchEndpointService.initsearchParamsSettings('searchParamsSettings',routingShowLatest)},
                resetMethod: function(){
                    $scope.$apply(function(){
                        delete $rootScope.searchParamsSettings;
                    });
                }
            }); */
    
            $scope.pageName = 'searchPage';
            $scope[$scope.pageName + '_infinitizer'] = {
                name: $scope.pageName+'_searchResults',
                assembleHubModel :function(cachedConstraints){
                    var constraints= {};
                    constraints['result.userSearchResults'] = cachedConstraints;
                    return {
                        name:'LegacyQuickSearch',
                        params:[
                            $rootScope.searchParamsSettings,
                        ],
                        constraints: constraints
                    };
                },
                resetDeterminer: function(cbs){
                    var loggedUserWatchOnce = $scope.$watch('loggedUser',function(loggedUser){
                        if(typeof loggedUser !== 'undefined'){
                            loggedUserWatchOnce();
                            var firstTimeDefined = true;;
                            $scope.$watch('searchParamsSettings',function(newValue){
                                console.log('newValue',newValue)
                                if(typeof newValue === 'undefined'){
                                    //Very first time on search page


                                    searchEndpointService.initsearchParamsSettings('searchParamsSettings',routingShowLatest);
                                    cbs.reInit();
                                    cbs.reConstraints()
                                    // console.log('++++ param settings generated')
                                    // console.log('1a. resetDeterminer reInit')
                                } else {
                                    //Already 
                                    if(firstTimeDefined){
                                        //returning to the search page.
                                        console.log('Returning to the search page, or first time.')
                                        cbs.resetOrRestoreResults();
                                    } else {
                                        //Already on the search page, new settings
                                        console.log('Already on the search page, new settings');
                                        cbs.reInit();
                                        cbs.reConstraints();
                                        cbs.resetOrRestoreResults();
                                    }


                                    // console.log('++++ I see param settings have changed, must reset')
                                    // cbs.reConstraints()
                                    //when those params settings are updated, they are no longer undefined
                                    //and we call the function below.
                                    
                                    // console.log('1b. resetDeterminer resetOrRestorResults')
                                    firstTimeDefined = false;
                                }
                                
                            },true); 
                        }
                    });
                },
                initialFetchAmt:1,
                maxScreens:26,

                preserveTopScreenAmt: 1,
                chopTopOnDestroy:true
            };



            $scope.items = [
                {
                    basics:{
                        username:'werqwe rqwer qwrqwerq'
                    }
                },
                {
                    basics:{
                        username:'zxcv zxcv zvcx '
                    }
                }
            ]









        }
    ]);
});