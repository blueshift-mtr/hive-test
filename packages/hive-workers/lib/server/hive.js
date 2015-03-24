Future = Npm.require('fibers/future');

Hive = {
    _maxJobs : 1000,
    insertJob : function(name, data) {
        console.log("Requesting work to be done,", name, data);
        Meteor.call('addJobToHiveQueue', name, data);
    }
};

function initJobPub(userId) {
    if(Meteor.isServer) {
        Meteor.publish('allHiveJobs', function() {
            HiveJobs.find({ locked: false });
        });
    }
}

Meteor.methods({
    addJobToHiveQueue: function(name, data) {
        console.log("Adding job...", name, data);
        HiveJobs.insert({
            name: name,
            data: data || {},
            added: new Date(),
            locked: false
        });
    },
    hiveQueueJobComplete: function(id) {
        HiveJobs.remove(id);
    },
    hiveQueueJobFailed: function(id) {
        var fut = new Future();

        HiveJobs.update(id,
            {
                $set: {
                    locked : false
                }
            }, function(err, res){
                if(err) throw new Meteor.Error('mongo-err', err);
                else fut.return();
            });

        return fut.wait();
    },
    getNextJob: function() {
        var fut = new Future();

        //TODO: Sort by date
        var job = HiveJobs.findOne( { locked: false });

        if(job) {
            //Lock Job
            HiveJobs.update(job._id, {
                $set: {
                    locked: true,
                    assigned: this.userId
                }
            }, function(err, res){
                if(err) throw new Meteor.Error('mongo-err', err);
                else fut.return(job);
            });
        } else {
            return -1;
        }
        return fut.wait();
    }
});

