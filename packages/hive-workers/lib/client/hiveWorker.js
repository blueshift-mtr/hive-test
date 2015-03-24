HiveWorker = {
    _currentJobNum : 0,
    _maxConcurrentJobs : 30,
    _jobMap : {},

    addWorker : function(callback) {
        console.log("Attempting to subscribe");
        Meteor.subscribe('allHiveJobs', function () {
            console.log("Subscribed to all hive jobs");
            createHiveObserver();
        });
    },
    jobSchema : function(name, func) {
        this._jobMap[name] = {};

        this._jobMap[name] = func;
        console.log("ADDED" + this._jobMap[name]);
    }
};

Hive = {
    insertJob : function(name, data, callback) {
        console.log("Requesting work to be done,", name, data);
        Meteor.call('addJobToHiveQueue', name, data);
        callback && callback();
    }
};
