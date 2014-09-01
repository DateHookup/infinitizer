(function (app) {app.run([function(){
    app.register.controller('baseCtrl', [
        '$scope','$rootScope','$location','$interval','$timeout','$q',
        function($scope,$rootScope,$location,$interval,$timeout,$q){
            $scope.baseTest = "baseTest!!";
            $scope.baseScope = $scope;
            $scope.page = '';
            $scope.setPage = function(content){
                $scope.page = content;
            };
        }
    ]);
    app.register.controller('testInfCtrl', [
        '$scope','$rootScope','$location','$interval','$timeout','$q',
        function($scope,$rootScope,$location,$interval,$timeout,$q){
            var db = []
            for(var i=0;i<400;i++){
                db.push({
                    name:i+'_name'
                })
            }
            var Api = function(){
                this.db = db;
            };
            Api.prototype.get = function(params){
                var def = $q.defer();

                var constraints = params.constraints;

                var response = {
                    results: this.db.slice(constraints.offset, constraints.offset + constraints.limit)
                };

                $timeout(function(){
                    def.resolve(response);
                },100);

                return def.promise
            };

            var api = new Api();

            


            $scope.searchParamsSettings = 'x';

            $scope.widgetNamespace = $scope.$id;
            $scope.$widgetScope = $scope;
                
            $scope.pageName = 'searchPage';
            $scope[$scope.pageName + '_infinitizer'] = {
                name: $scope.pageName+'_searchResults',
                assembleHubModel :function(constraints){
                    return {
                        name:'LegacyQuickSearch',
                        params:[
                            $rootScope.searchParamsSettings,
                        ],
                        constraints: constraints
                    };
                },
                callEndpoint: function(model){
                    return api.get(model);
                },
                resultPathInResponse:'results',
                resetDeterminer: function(cbs){
                    // var loggedUserWatchOnce = $scope.$watch('loggedUser',function(loggedUser){
                        // if(typeof loggedUser !== 'undefined'){
                            // loggedUserWatchOnce();
                            var firstTimeDefined = true;;
                            $scope.$watch('searchParamsSettings',function(newValue){
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
                                        // console.log('Returning to the search page, or first time.')
                                        cbs.resetOrRestoreResults();
                                    } else {
                                        //Already on the search page, new settings
                                        // console.log('Already on the search page, new settings');
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
                        // }
                    // });
                },
                initialFetchAmt:1,
                maxScreens:3,

                preserveTopScreenAmt: 1,
                chopTopOnDestroy:true
            };
        }
    ]);
}]);})(app);