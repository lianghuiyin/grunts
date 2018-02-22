Hsc.Chip = DS.Model.extend({
    instance: DS.belongsTo('instance'),
    trace: DS.belongsTo('trace'),
    console: DS.belongsTo('console'),
    previous_chip: DS.belongsTo('chip', {inverse: null}),
    start_date: DS.attr('date'),
    end_date: DS.attr('date'),
    is_finished: DS.attr('boolean', {defaultValue: false}),
    yellow_due: DS.attr('date'),
    red_due: DS.attr('date'),
    color: DS.attr('string'),
    state: DS.attr('string'),
    handler: DS.belongsTo('user'),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    modifier: DS.attr('string'),
    modified_date: DS.attr('date'),
    createrObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    modifierObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    /**
     * [realTimeoutColor 全局定时器定时更新该属性值，只更新is_finished为false的chip]
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
    }.property("is_finished","color")
});

Hsc.ConsoleChip = DS.Model.extend({
    chip: DS.belongsTo('chip'),
    creater: DS.attr('string'),
    created_date: DS.attr('date')
});

Hsc.ChipToggleView = Ember.IconToggleButtonView.extend({
    click:function(){
        if(this.get("isLoading")){
            return;
        }
        this.set("isLoading",true);//模拟发送请求到服务器时的加载中状态
        var chip = this.get("content");
        chip.store.unloadAll("console_chip");
        var now = new Date();
        var consoleChip = chip.store.createRecord("console_chip",{
            chip: chip,
            creater: Hsc.get("currentUser.id"),
            created_date: now
        });
        var prom = consoleChip.save();
        prom.then(function(answer){
            !this.get("isDestroyed") && this.set("isLoading",false);
            this.unloadAllRecord(chip);
        }.switchScope(this), function(reason){
            !this.get("isDestroyed") && this.set("isLoading",false);
            this.unloadAllRecord(chip);
        }.switchScope(this));
        return prom;
    },
    unloadAllRecord:function(chip){
        Ember.run.later(this,function(){
            chip.store.unloadAll("console_chip");
        },5000);
    },
    clickOld: function(event) {
        
        if(this.get("isLoading")){
            return;
        }
        this.set("isLoading",true);//模拟发送请求到服务器时的加载中状态
        Ember.run.later(this,function(){
            var chip = this.get("content"),
                now = new Date(),
                nowStr = now.format("yyyy-MM-dd hh:mm:ss"),
                currentUser = this.get("controllers.session.user"),
                currentState = chip.get("state"),
                currentConsole = chip.get("console"),
                nextState = currentState == "on" ? "off" : "on",
                nextYellowTimeout = currentState == "on" ? currentConsole.get("on_yellow_timeout") : currentConsole.get("off_yellow_timeout"),
                nextRedTimeout = currentState == "on" ? currentConsole.get("on_red_timeout") : currentConsole.get("off_red_timeout"),
                nextColor = currentState == "on" ? currentConsole.get("on_color") : currentConsole.get("off_color");
            //模拟服务器端更新当前chip逻辑
            chip.set("end_date",now);
            chip.set("is_finished",true);
            if(now > chip.get("red_due")){
                chip.set("color","red");
            }
            else if(now > chip.get("yellow_due")){
                chip.set("color","yellow");
            }
            chip.set("modifier",currentUser);
            chip.set("modified_date",nowStr);

            //模拟服务器端新建下一个chip逻辑
            var nextChip = this.get("content").store.createRecord("chip",{
                instance: chip.get("instance"),
                trace: chip.get("trace"),
                console: currentConsole,
                previous_chip:chip,
                start_date: nowStr,
                end_date: null,
                is_finished: false,
                yellow_due: nextYellowTimeout ? now.addMinutes(nextYellowTimeout).format("yyyy-MM-dd hh:mm:ss") : null,
                red_due: nextRedTimeout ? now.addMinutes(nextRedTimeout).format("yyyy-MM-dd hh:mm:ss") : null,
                color: nextColor,
                state: currentState == "on" ? "off" :"on",//这里直接模拟服务器更改state状态为当前状态的反状态，省略了实际逻辑中应该包括的当前状态检验逻辑
                creater: currentUser,
                created_date: nowStr,
                modifier: currentUser,
                modified_date: nowStr
            });

            //模拟服务器端更新chip对应的trace逻辑
            chip.get("trace").set("modifier",currentUser);
            chip.get("trace").set("modified_date",nowStr);

            //模拟服务器端更新chip对应的instance逻辑
            chip.get("instance").set("modifier",currentUser);
            chip.get("instance").set("modified_date",nowStr);



            //保存到服务器
            chip.save();
            nextChip.save();
            chip.get("trace").save();
            chip.get("instance").save();

            // var value = this.get("value"),
            //     onValue = this.get("onValue"),
            //     offValue = this.get("offValue");
            // this.set("value",value == onValue ? offValue : onValue);
            this.set("isLoading",false);
        },1000);
    }
});

Hsc.Chip.FIXTURES = [
    {
        id:1,
        instance: 3,
        trace: 33,
        console: 1,
        previous_chip: null,
        start_date: '2014-02-02 14:03:00',
        end_date: '2014-02-02 15:03:00',
        is_finished: true,
        yellow_due: '2014-02-02 14:44:00',
        red_due: '2014-02-02 15:53:00',
        color: 'gray',
        state: 'off',
        creater: 1,
        created_date: '2014-02-03 12:03:00',
        modifier: 7,
        modified_date: '2014-02-02 15:03:00'
    },
    {
        id:11,
        instance: 3,
        trace: 33,
        console: 1,
        previous_chip: 1,
        start_date: '2014-02-02 15:03:00',
        end_date: null,
        is_finished: false,
        yellow_due: '2014-02-02 16:44:00',
        red_due: '2014-02-02 17:53:00',
        color: 'green',
        state: 'on',
        creater: 7,
        created_date: '2014-02-02 15:03:00',
        modifier: 7,
        modified_date: '2014-02-02 15:03:00'

    }
];
