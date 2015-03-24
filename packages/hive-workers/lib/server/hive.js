Future = Npm.require('fibers/future');

Hive = {
    _maxJobs : 1000,

    //Shared
    addJob : function(jobType, data) {

    },

    //Server Only
   configure : function() {
        initHiveJobPub();
    }
};

function initJobPub(userId) {
    if(Meteor.isServer) {
        Meteor.publish('allHiveJobs', function(userId) {
            HiveJobs.find({ assign : userId });
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
    lockJob: function(jobId) {
        var fut = new Future();

        var job = HiveJobs.findOne(jobId);

        if(job && job.locked && job.locked === true) {
            throw new Meteor.Error('single-lock-error', 'Tried to Lock A Locked Job');
        } else {

            var lock = {
                assign: this.userId || null,
                locked: true
            };

            HiveJobs.update(jobId,
                {
                    $set : lock
                }, function(err, res){
                    if(err) throw new Meteor.Error('mongo-err', err);
                    else {
                        fut.return(200);
                    }
                });
        }

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

