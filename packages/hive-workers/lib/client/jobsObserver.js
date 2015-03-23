createHiveObserver = function() {
    HiveJobs.find().observe({
        added: function() {
            if(HiveWorker._currentJobNum < HiveWorker._maxConcurrentJobs) {
                getNextJobs();
            }
        },
        changed : function() {

        },
        removed: function() {
            console.log("Removed hive jab");
            getNextJobs();

        }
    });
};

function getNextJobs() {
    for(var i = 0; i < (HiveWorker._maxConcurrentJobs - HiveWorker._currentJobNum); i++ ) {
        getNextJob();
    }
}

function getNextJob() {
    HiveWorker._currentJobNum++;
    console.log("Inside getNextJob");
    var sorted = HiveJobs.find({ locked: false }).fetch();
    console.log("Got jobs", sorted);
    var job = sorted.length > 0 ? sorted[0] : null;

    if(job) {
        startJob(job);
    }
};

function startJob(job) {
    var thisJobId = job._id;
    lock(thisJobId);

    var jobs = HiveWorker._jobMap;
    console.log("Starting job", job.name);
    console.log(jobs[job.name]);

    if(!_.has(jobs, job.name)) {
        //TODO: Handle this case where the client doesnt have that job, (probably unassign)
        console.log("Couldnt find job in the job map");
        return;
    }

    var data = null;

    if(job.data) {
        data = job.data;
    }

    HiveWorker._jobMap[job.name](data, function(successData) {
        console.log("Callback Recieved");
        console.log("Completing", job._id);
        Meteor.call('hiveQueueJobComplete', job._id);
        HiveWorker._currentJobNum--;
    }, function(failureData) {
      console.log("Failed");
        jobFailed(thisJobId, failureData)
    });
};

function lock(jobId) {
    HiveJobs.update(job._id,
        {
            $set : { locked : true }
        }
    );
}
function unlock(jobId) {
    HiveJobs.update(job._id,
        {
            $set : { locked : false }
        }
    );
}

function jobFailed(jobId, failureData) {
    HiveJobs.update(job._id,
        {
            $push : { jobResults : failureData }
        },
        {
            $set : {
                added : new Date(),
                locked : false
            }
        }
    );
};