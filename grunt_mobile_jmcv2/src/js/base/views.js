Ember.IconToggleButtonView = Ember.View.extend({
    onValue:"on",
    offValue:"off",
    onIcon:"glyphicon-stop",
    offIcon:"glyphicon-play",
    loadingIcon:"glyphicon-transfer",
    isLoading:false,
    tagName:"span",
    title:"",
    value:"off",
    content:null,
    _iconClass:function(){
        if(this.get("isLoading")){
            return this.get("loadingIcon");
        }
        else{
            var value = this.get("value"),
                onValue = this.get("onValue"),
                offValue = this.get("offValue"),
                onIcon = this.get("onIcon"),
                offIcon = this.get("offIcon");
            return value == onValue ? onIcon : offIcon;
        }
    }.property("value","isLoading"),
    classNames: ['icon-toggle-view btn'],
    template: Ember.Handlebars.compile('<span {{bind-attr class=":glyphicon view._iconClass"}}></span>\
        {{#if view.title}}<div class = "icon-toggle-title">{{view.title}}</div>{{/if}}'),
    // render:function(buffer){

    // },
    // click: function(event) {
    //     this.set("isLoading",true);
    //     var value = this.get("value"),
    //         onValue = this.get("onValue"),
    //         offValue = this.get("offValue");
    //     this.set("value",value == onValue ? offValue : onValue);
    // }
});

Ember.NumberView = Ember.View.extend({
    dot:0,//小数点位数
    symbol:"+-",//正负数，+/-/+-
    value:"0",//值
    tagName:"input",
    classNames: ['number-view'],
    attributeBindings: ['value','placeholder'],
    placeholder:"",
    eventManager: Ember.Object.create({
        getCursorLocation:function(elm) {  
            if(elm.createTextRange) { // IE               
                var range = document.selection.createRange();                 
                range.setEndPoint('StartToStart', elm.createTextRange());                 
                return range.text.length;  
            } else if(typeof elm.selectionStart == 'number') {  
                return elm.selectionStart;  
            }
        },
        keyPress: function(event, view) {
            var symbol = view.get("symbol"),
                dot = view.get("dot"),
                oldValue = view.element.value;
            var loc = this.getCursorLocation(view.element);
            if (event.keyCode == 45) {
                if(symbol == "+-" || symbol == "-"){
                    if(loc == 0 && view.element.value.indexOf("-") == -1){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
                else{
                    return false;
                }
            }
            else if (event.keyCode == 46) {
                if(dot == 0){
                    return false;
                }
                if (loc == 0 || view.element.value.indexOf(".") != -1) {
                    return false;
                }
                if(loc < oldValue.length - dot){
                    return false;
                }
            } 
            else {
                if(event.keyCode >= 45 && event.keyCode <= 57){
                    if(dot > 0){
                        var indexOfDot = oldValue.lastIndexOf(".");
                        if(indexOfDot > 0 && loc > indexOfDot && (oldValue.length - indexOfDot) > dot){
                            return false;
                        }
                    }
                }
                else{
                    return false;
                }
            }
        },
        keyUp: function(event, view) {
        },
        focusOut: function(event, view) {
            var oldValue = view.element.value,
                newValue = oldValue;
            if (oldValue.lastIndexOf(".") == (oldValue.length - 1)) {
                newValue = newValue.substr(0,oldValue.length - 1);
            }
            if (/(0+$)/.test(newValue)) {
                if (newValue.lastIndexOf(".") >= 0) {
                    newValue = newValue.replace(/(0*$)/g, "");
                    newValue = newValue.replace(/(\.*$)/g, "");
                }
            }
            if (/(^0+)/.test(newValue)) {
                newValue = newValue.replace(/^0*/g, '0');
                if (/(^[0]{1}[1-9]{1,})/.test(newValue)) {
                    newValue = newValue.replace(/^0*/g, '');
                }
            }
            if (isNaN(newValue)) {
                newValue = "0";
            }
            view.element.value = newValue;
            view.set("value",newValue);
        },
        change: function(event, view) {
            var newValue = view.element.value.replace(/[^0-9\.-]/g,"");
            view.element.value = newValue;
            view.set("value",newValue);
        }
    })
});