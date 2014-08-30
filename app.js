
window.app = (function(){
	var app = angular.module('myApp', []);
	//---
	//This fixes links so that they don't change scroll, which  was the default behavior.
	//https://groups.google.com/forum/#!topic/angular/bwS5kTb5Iaw
	//#magical
	app.value('$anchorScroll', angular.noop);

	//stick a reference of the utility library to the app object so it's available everywhere.
	app.dhUtil = dhUtil;

	//NEEDED FOR AMD: THE DEPENDECIES LISTED BELOW (except for $routeProvider)
	app.config(['$controllerProvider', '$compileProvider', '$filterProvider', '$provide','$animateProvider', '$httpProvider',
	    function ($controllerProvider, $compileProvider, $filterProvider, $provide, $animateProvider, $httpProvider ) {
	    	console.log('x')
	    	app.$httpProvider = $httpProvider;

			app.register = {
		        controller: $controllerProvider.register,
		        directive: $compileProvider.directive,
		        filter: $filterProvider.register,
		        factory: $provide.factory,
		        service: $provide.service,
		        animation: $animateProvider
		    };
		}
	]);

	app.run(['$templateCache',function($templateCache){
		$templateCache.put("htmlPartialModuleWrap.html",
		    '<div ng-include src="htmlPartialModule" class="htmlPartialModule"></div>'
		);
	}]);

	angular.bootstrap(document, ['myApp']);

	app.cachedDocInj = angular.element(document).injector();

	return app;
})();