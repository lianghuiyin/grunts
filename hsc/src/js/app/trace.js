Hsc.Trace = DS.Model.extend({
    instance: DS.belongsTo('instance'),
    previous_trace: DS.belongsTo('trace', {inverse: null}),
    car: DS.belongsTo('car'),
    bedstand: DS.belongsTo('bedstand'),
    running_state: DS.attr('string', {defaultValue: "waiting"}),//当前台架所处运行状态：waiting（待样）、running（运行）、repairing（检修）
    step_running_state: DS.attr('string', {defaultValue: "waiting"}),//当前步骤台架目标运行状态：waiting（待样）、running（运行）、repairing（检修）
    vehicletype: DS.belongsTo('vehicletype'),
    is_bedstand: DS.attr('boolean', {defaultValue: false}),
    step: DS.belongsTo('step'),
    organization: DS.belongsTo('organization'),
    user: DS.belongsTo('user'),
    start_date: DS.attr('date'),
    end_date: DS.attr('date'),
    is_finished: DS.attr('boolean', {defaultValue: false}),
    is_skip_weekend: DS.attr('boolean', {defaultValue: true}),
    yellow_due: DS.attr('date'),
    red_due: DS.attr('date'),
    due_days: DS.attr('number'),
    percentage: DS.attr('number'),
    color: DS.attr('string'),
    info: DS.attr('string'),
    handler: DS.belongsTo('user'),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    modifier: DS.belongsTo('user'),
    modified_date: DS.attr('date'),
    /**
     * [realTimeoutColor 全局定时器定时更新该属性值，只更新is_finished为false的trace]
     * @return {[sttring]} [颜色gray/green/yellow/red]
     */
    realTimeoutColor:function(){
        if(this.get("is_finished")){
            return this.get("color");
        }
        else{
            var now = new Date();
            var red_due = this.get("red_due");
            var yellow_due = this.get("yellow_due");
            if(red_due && now > new Date(red_due)){
                return "red";
            }
            else if(yellow_due && now > new Date(yellow_due)){
                return "yellow";
            }
            else{
                return this.get("color");
            }
        }
    }.property("is_finished","color"),
    /**
     * [realTimeoutBgColor 当realTimeoutColor变化时背景色同步更新]
     * @return {[sttring]} [颜色bg-gray/bg-green/bg-yellow/bg-red]
     */
    realTimeoutBgColor:function(){
        return "bg-%@".fmt(this.get("realTimeoutColor"));
    }.property("realTimeoutColor"),
    /**
     * [realTimeoutPercentage 全局定时器定时更新该属性值，只更新is_finished为false的trace]
     * @return {[sttring]} [百分比数值，比如70%，则返回70]
     */
    realTimeoutPercentage:function(){
        console.log("realTimeoutPercentage==========")
        if(this.get("is_finished")){
            return "";
        }
        if(this.get("is_finished")){
            return this.get("percentage").toString();
        }
        else{
            var start_date = new Date(this.get("start_date").getTime());
            var due_days = this.get("due_days");
            if(due_days){
                var now = new Date();
                var is_skip_weekend = this.get("is_skip_weekend");

                var timeOffset = HOJS.lib.dateDiffForWorkday(start_date, now, is_skip_weekend);
                var percentage = HOJS.lib.accDiv(100 * timeOffset, due_days * 24 * 60 * 60);
                return HOJS.lib.deci(percentage,0);
            }
            else{
                return -1;
            }
        }
    }.property("is_finished","percentage","due_days"),
    titleTag:function(){
        if(this.get("is_finished")){
            return "";
        }
        return "始于" + this.get("start_date").format("yyyy-MM-dd hh:mm:ss") + "，"
         + (this.get("is_skip_weekend") ? "跳过周未，" : "")
         + this.get("due_days") + "天后结束于" + this.get("yellow_due").format("yyyy-MM-dd hh:mm:ss") + "，已流转至" + this.get("organization.name");
    }.property("start_date","due_days"),
    timeTag:function(){
        if(this.get("is_finished")){
            return "";
        }
        var start_date = this.get("start_date");
        var yellow_due = this.get("yellow_due");
        if(yellow_due){
            return yellow_due.format("MM/dd"); 
        }
        else{
            return start_date.format("MM/dd");
        }
    }.property("start_date"),
    timeStatus:function(){
        if(this.get("is_finished")){
            return "";
        }
        if(this.get("due_days")){
            return this.get("realTimeoutPercentage") + "% " + this.get("timeTag");
        }
        else{
            return this.get("timeTag");
        }
    }.property("timeTag","realTimeoutPercentage"),
    percentageClass:function(){
        if(this.get("is_finished")){
            return "";
        }
        var percentage = this.get("realTimeoutPercentage");
        if(percentage > 100){
            percentage = 100;
        }
        return "w%@per".fmt(percentage);
    }.property("realTimeoutPercentage"),
    modifiedDateDidChange:function(){
        var end_date = this.get("end_date"),
            instance = this.get("instance"),
            type = this.get("step.type");
        //当后台添加trace的时候无法通知其instance自动更新traces属性，这时手动通知
        //新添加的步骤end_date为null，如果是版本升级或恢复流转步骤则其end_date不为null
        if((!end_date || type == "upgrade" || type == "recove") && instance){
            
            instance.notifyPropertyChange("modified_date");
        }
    }.observes("instance")
});
