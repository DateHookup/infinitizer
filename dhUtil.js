window.dhUtil = (function () {

  var validation = function(){};
  validation.prototype.isEmail = function(email){
    return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(email);  
  }





  var obj = function(){
    this.validation = new validation();
  };
  
  obj.prototype.getYOffset = function($el){
            var posY;
            if(typeof $el === 'undefined' || $el === window ){
                    if(typeof(window.pageYOffset)=='number') {
                       posY=window.pageYOffset;
                    }
                    else {
                       posY=document.documentElement.scrollTop;
                    }
            } else {
                    posY = $el[0].scrollTop;
            }
            return posY;
    };

    obj.prototype.cssTransitioner = function(cssTransObj){
            /*
            dhUtil.cssTransitioner{
              className: asdf,//string
              target: asdf,//$el
              cssProperty: asdf,//string
              cssValue: asdf,//string
              applyTarget: asdf,//$el
              duration:asdf,//num
              ease:asdf,//string
              callback: function(applyTarget){}
            }
            */
            /*
            cssTransObj = {

                className: string
                //Name of class with animation properties to apply.
                //Optional.  If omitted, there must be a cssValue property instead.
                //If included, modeClass is set to true.

                

                target:$el,
                //Required
                //This is the element that has the animated property.
                //It will have a -webkit-transition property added during the animation.
                //It will get a listener for transitionEnd.
                //If modeClass === false, this element has the css applied to it.

                cssProperty: string
                //This is a css property that gets animated, like '-webkit-transform'.
                //This is required if modeClass === false.
                //If modeClass === true, this specifies what property gets transitioned, else All gets transitioned.
                
                cssValue: 
                //if there is no className, then this is required.

                callback: function(applyTarget){...}
                //fired after transtionend.  
                //If obj.applyTarget exists, this is passed, otherwise target is passed.

                applyTarget: $el,
                //optional
                //If modeClass === true, this is used instead of target to apply the class
                //target is still used for transitionEnd handling, so target is still required.

                duration:num,
                //duration of animation in ms.  
                //optional.  set to 1200 if left blank.

                ease:string,
                //easing curve for animation
                //optional.  set to 'ease-out' if blank
                //options are: ease, linear, ease-in, ease-out, ease-in-out, cubic-bezier(n,n,n,n)
                
                

            }
            */
            // var defaults = {
            //     duration:1200,
            //     ease:'linear',
            //     target:$(),
            //     cssProperty:'-webkit-transform'
            // }


            var modeClass = false;
            if(typeof cssTransObj.className !== 'undefined'){
              modeClass = true;
            }


            if(typeof cssTransObj.duration === 'undefined'){
                    cssTransObj.duration = 1200;
            }
            if(typeof cssTransObj.ease === 'undefined'){
                    cssTransObj.ease = 'ease-out';
            }

            var transProp = 'all'
            if(typeof cssTransObj.cssProperty !== 'undefined'){
              transProp = cssTransObj.cssProperty;
            }

            var applyTarget = cssTransObj.target;
            if(typeof cssTransObj.applyTarget !== 'undefined'){
              applyTarget = cssTransObj.applyTarget;
            }


            


            cssTransObj.target.css({
                    '-webkit-transition': transProp+' '+cssTransObj.duration+'ms '+cssTransObj.ease
            })

            cssTransObj.target.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd",function(event){
                    // console.log('END')
                    if(cssTransObj.target.is($(event.target))){//a selector of more than one jqueryObject might be passed.  Also, there could be transitions on child element (like buttons) and child element transitions trigger the callback.  So this conditional confirms that it's the targeted element itself that gets listened to and this works for a selector of multiple elements.
                    //if(event.target == cssTransObj.target[0]){
                            //(event.originalEvent.propertyName + ' - - - ping')
                            if(event.originalEvent.propertyName.indexOf(cssTransObj.cssProperty) !=-1){//unintended css events leaked through, messing up sequence.  COnditional here fixes it.  Might use property name as argument so this is customizable.
                                    cssTransObj.target.unbind('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd');
                                    cssTransObj.target.css({'-webkit-transition': ''})
                                    cssTransObj.callback(applyTarget);        
                            }
                    }
            })
            // window.setTimeout(function(){
                    //requestAnimFrame(function(){
            if(modeClass){
              // console.log(applyTarget)
              // console.log(cssTransObj)
              // debugger;
              applyTarget.addClass(cssTransObj.className);
              // console.log(cssTransObj.class)
              
            }else{
                applyTarget.css(cssTransObj.cssProperty,cssTransObj.cssValue)
            }
                    //});
            // },0)
    };

    obj.prototype.returnTransitJsTranslateOrFallbackCssObj = function(xyzArray){
        function has3d(){var e=document.createElement("p"),t,n={webkitTransform:"-webkit-transform",OTransform:"-o-transform",msTransform:"-ms-transform",MozTransform:"-moz-transform",transform:"transform"};document.body.insertBefore(e,null);for(var r in n){if(e.style[r]!==undefined){e.style[r]="translate3d(1px,1px,1px)";t=window.getComputedStyle(e).getPropertyValue(n[r])}}document.body.removeChild(e);return t!==undefined&&t.length>0&&t!=="none"}//http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
        if(!has3d()){
            console.log(has3d())
            var a = [];
            for(var i = 0, l = xyzArray.length; i<l; i++){
                var v = typeof xyzArray[i] === 'string' ? xyzArray[i] : xyzArray[i] + 'px';
                a.push();
            }
            if(xyzArray[0] !==0 && xyzArray[1] !==0){
                return {
                    'top':a[0],
                    'left':a[1]
                }
            }
        }
        return {
            'translate': xyzArray
        }

    };

    obj.prototype.returnScrollTop = function(){
        var pageY;
        if(typeof(window.pageYOffset)=='number') {
           pageY=window.pageYOffset;
        }
        else {
           pageY=document.documentElement.scrollTop;
        }
        return pageY;
    };


    //Derived from www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
    //Debouncing prevents rapid fire resize events.
    //event is only fired if it's been still for a moment.
    obj.prototype.debounce = function ($timeout, func, threshold, execAsap, firstAsap) {
      var timeout;
      var firstAsapClear = false;
      if(typeof firstAsap === 'undefined' || firstAsap ===null || firstAsap ===false){
        firstAsap = false;
      } else {
        firstAsapClear = true;
      }
      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
                  if(firstAsap){
                    firstAsapClear = true;
                  }
              timeout = null;
          };

          if (timeout){
              $timeout.cancel(timeout);
          } else if (execAsap){
              func.apply(obj, args);
          } else if (firstAsapClear){
                console.log('FAST')
              func.apply(obj, args);
              firstAsapClear = false;
          }          

          timeout = $timeout(delayed, threshold || 100);
      };
    }


    obj.prototype.formatImageID = function(t, id) {
        return t + "/" + id.substring(0,4) + "/" + id.substring(4, 6) + "/" + id.substring(6, 8) + "/" + id;
    }

    obj.prototype.endsWith = function (string,substring) {
      var t = string;
      var s = substring
      return t.length >= s.length && t.substr(t.length - s.length) == s;
    }

    var $appStatus;
    var appStatusMsg = ''
    obj.prototype.appStatus = function(msg){
      // window.setTimeout(function(){


      if(typeof $appStatus ==='undefined'){
        $appStatus = $('#appStatus');
      }
      appStatusMsg = (msg+'<br />' + appStatusMsg);

      $appStatus.html(appStatusMsg)
    // })
    };

    obj.prototype.findNextZeroModulusOfFirst = function(a,b){
        var recurse = function(){
            if(a % b !== 0){
                a++;
                recurse(a,b);
            }
        };
        recurse(a,b)
        return a
    };

    obj.prototype.calculateAge = function(birthDate) {
        var otherDate = new Date();

        var years = (otherDate.getFullYear() - birthDate.getFullYear());

        if (otherDate.getMonth() < birthDate.getMonth() || 
            otherDate.getMonth() == birthDate.getMonth() && otherDate.getDate() < birthDate.getDate()) {
            years--;
        }

        return years;
    };

    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    obj.prototype.formatChatDate = function(dateObj){
        return (
            monthNames[dateObj.getMonth()].toUpperCase() + ' ' +
            dateObj.getDate() + ' at ' + 
            dateObj.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")
        );
    };

    obj.prototype.inchesToFeet = function(inches) {
      return Math.floor(inches/12) + ' ft. ' + inches%12 +' in.';
    }
    obj.prototype.feetToInches = function(feetString) {
      //expecting string like like '6 ft. 5 in.'
      //outputs interval
      if(feetString){
        feetString += ''; 
        feetString = feetString.replace(/\./g,'');
        feetString = feetString.replace(' ','');
        feetString = feetString.replace('in','');
        var arr = feetString.split('ft');
        var inches = (+arr[0] * 12) + +arr[1];
        return inches;
      } else{
        return feetString

      }
    }

    obj.prototype.dateToAgoString = function(datex){
        var strings = [];
        // get total seconds between the times
        var delta = Math.abs(new Date() - datex) / 1000;

        // calculate (and subtract) whole days
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        if(days > 0){
            strings.push(days + ' days,')
        }

        // calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        if(hours > 0){
            strings.push(hours + 'h')
        }

        // calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        if(minutes > 0){
            strings.push(minutes + 'm')
        }

        // what's left is seconds
        // var seconds = (delta % 60).toFixed(0);  // in theory the modulus is not required
        // if(seconds > 0){
        //     strings.push(seconds + 's')
        // }

        return strings.join(' ') + ' ago'
    };

    var daysOfWeek = ['Sun','Mon','Tue','Wed','Thur','Fri','Sat'];


    obj.prototype.dateToInboxDateString = function(dateObj){
      var dayInMs= 86400000;
      var weekInMs = dayInMs * 7;
      var yearInMs = dayInMs * 365;
      var age = new Date() - dateObj;
      var string = '';
      if(age > yearInMs){
        //string = '12/10/1979'
        string = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear()
      } else if(age > weekInMs) {
        // string = 'Feb 12'
        string = monthNames[dateObj.getMonth()] + ' ' + dateObj.getDate()
      } else if(age > 2 * dayInMs) {
        // string = 'Thu'
        string = daysOfWeek[dateObj.getDay()];
      } else if(age > dayInMs) {
        string = 'Yesterday'
      } else {
        // string = '1:30PM'
        string = dateObj.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")
      }

      return string;
    };


    obj.prototype.isEmpty = function(obj) {
      for(var prop in obj) {
          if(obj.hasOwnProperty(prop))
              return false;
      }

        return true;
    }

    obj.prototype.isArray = function(someVar){
      if( Object.prototype.toString.call( someVar ) === '[object Array]' ) {
          return true;
      } else {
        return false;
      }
    };
    var xx = null;
    obj.prototype.propertyAt = function index(objx,at,value) {
        //when assigning values, if there is a long object chain desired, if that chain doesn exist, it will be created.
        if (typeof at == 'string'){
          xx = objx;
          at = at.replace(/\[(\w+)\]/g, '.$1');

            return index(objx,at.split('.'), value);

        }else if (at.length==1 && value!==undefined){
            return objx[at[0]] = value;
        }else if (at.length==0){
            return objx;
        }else{
            if(typeof objx[at[0]] === 'undefined'){
              objx[at[0]] = {};
            }
            return index(objx[at[0]],at.slice(1), value);
        }
    }

    //Borrowed from underscore.js
    var getNow = Date.now || function() { return new Date().getTime(); };
    obj.prototype.throttle = function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      options || (options = {});
      var later = function() {
        previous = options.leading === false ? 0 : getNow();
        timeout = null;
        result = func.apply(context, args);
        context = args = null;
      };
      return function() {
        var now = getNow();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
          context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };

      obj.prototype.isValidEmail = function isEmail(email){ 
        return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email ); 
      }

      // var throttled = dhUtil.throttle(updatePosition, 100);
      // $(window).scroll(throttled);



          
    
    return new obj();
})();