Ember.Application.reopen({
    // dns:"http://vwtest.gicp.net:7777/",//API域名
    dns:"http://221.7.195.163:9110/",//API域名
    syncDns:function(dns){
        this.set("dns",dns);
        if(!window.localStorage){
            return;
        }
        localStorage.setItem("dns",dns);
    },
    origin:function(){
        var dns = this.get("dns");
        if(!dns.endWith("\/")){
            dns += "\/";
        }
        return "%@MobileServiceForJMCV2/".fmt(dns);
    }.property("dns"),
    // origin:"http://localhost:7777/MobileServiceForJMCV2/",
    // origin:"http://vwtest.gicp.net:7777/MobileServiceForJMCV2/",
    // origin:"http://221.7.195.163:9110/MobileServiceForJMCV2/",
    namespace:"API"//对应到asmx文件名
});

Ember.View.reopen({
  init: function() {
    this._super();
    var self = this;

    // bind attributes beginning with 'data-'
    Em.keys(this).forEach(function(key) {
      if (key.substr(0, 5) === 'data-') {
        self.get('attributeBindings').pushObject(key);
      }
    });
  }
});

Ember.Handlebars.helper('car_status', function(value,options) {
    var text = "";
    var stepName = options.hash.stepName;
    switch(value){
        case "unused":
            text = "闲置";
            break;
        case "turning":
            text = "流转中";
            if(stepName){
                text = stepName;
            }
            break;
        case "retired":
            text = "退役";
            break;
    }
    return '%@'.fmt(text);
});

Ember.Handlebars.helper('boolean', function(value) {
    var text = value ? "是" : "否";
    return '%@'.fmt(text);
});
Ember.Handlebars.helper('timefmt', function(value) {
    // console.log("timefmt:%@".fmt(value));
    if(value instanceof Date){
        return value.format("yyyy-MM-dd hh:mm:ss");
    }
    else{
        var date = HOJS.lib.parseDate(value);
        return date ? date.format("yyyy-MM-dd hh:mm:ss") : "";
    }
});
Ember.Handlebars.helper('datefmt', function(value) {
    // console.log("timefmt:%@".fmt(value));
    if(value instanceof Date){
        return value.format("yyyy-MM-dd");
    }
    else{
        var date = HOJS.lib.parseDate(value);
        return date ? date.format("yyyy-MM-dd") : "";
    }
});


