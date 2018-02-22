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