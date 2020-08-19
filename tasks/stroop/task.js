var subject = jsPsych.randomization.randomID(15); // random character subject id
var condition = 'control'; // experiment/task condition
var task = 'stroop';
var experiment = 'stroop';
var debug = true;
var no_incongruent_neighbors = true;
var show_feedback = true; // TODO: will explain this feature next time
var adaptive = true; // TODO: if true, adapt task difficulty (reduce rt_deadline if correct; increase rt_deadlline if wrong; by 50 ms)
var fullscreen = false;
var dark_background = false;
var practice_trials = 3; // restriction: the actual number of practice trials will only be multiples of 3, hence it might be smaller than the number defined here.
if (practice_trials < 3) {
    practice_trials = 3;
}

if (dark_background) {
    document.body.style.backgroundColor = "black";
    font_colour = "white";
} else if (!dark_background) {
    document.body.style.backgroundColor = "white";
    font_colour = "black";
};

const adaptive = true;
const no_incongruent_neighbors = false;
var rt_deadline = 1500;
var fixation_duration = 300;
var feedback_duration = 1500;
var itis = iti_exponential(low = 300, high = 800);

// unique stroop trials
// reps: how many times to repeat that object/stimulus
// objects have the data field because that allows jsPsych to store all the data automatically
var stimuli_unique = [  // unique stroop trials
    { data: { text: 'red', color: 'red', trialtype: 'congruent', reps: 2 } },
    // { data: { text: 'green', color: 'green', trialtype: 'congruent', reps: 3 } },
    // { data: { text: 'yellow', color: 'yellow', trialtype: 'congruent', reps: 4 } },
    // { data: { text: 'red', color: 'green', trialtype: 'incongruent', reps: 1 } },
    // { data: { text: 'red', color: 'yellow', trialtype: 'incongruent', reps: 1 } },
    // { data: { text: 'green', color: 'red', trialtype: 'incongruent', reps: 1 } },
    // { data: { text: 'green', color: 'yellow', trialtype: 'incongruent', reps: 1 } },
    // { data: { text: 'yellow', color: 'red', trialtype: 'incongruent', reps: 1 } },
    // { data: { text: 'yellow', color: 'green', trialtype: 'incongruent', reps: 1 } },
    // // { data: { text: 'xxxx', color: 'red', trialtype: 'neutral', reps: 2 } },
    // { data: { text: 'xxxx', color: 'green', trialtype: 'neutral', reps: 2 } },
    // { data: { text: 'xxxx', color: 'yellow', trialtype: 'neutral', reps: 2 } }
];

var color_key = { 'red': 'r', 'green': 'g', 'yellow': 'y' }; // color-key mapping

// parameters below typically don't need to be changed
var stimuli_repetitions = [];
var practice_stimuli_repetitions = [];
var practice_stimuli_congruent = [];
var practice_stimuli_incongruent = [];
var practice_stimuli_neutral = [];

// extract the value of the reps attribute in the stimuli_unique array & group stimuli of different trial types into different arrays
stimuli_unique.forEach(function (item) {
    stimuli_repetitions.push(item.data.reps);
    if (item.data.trialtype == 'congruent') {
        practice_stimuli_congruent.push(item);
    } else if (item.data.trialtype == 'incongruent') {
        practice_stimuli_incongruent.push(item);
    } else if (item.data.trialtype == 'neutral') {
        practice_stimuli_neutral.push(item);
    }
});
if (debug) {
    console.log(stimuli_repetitions);
    console.log(practice_stimuli_repetitions);
    // console.log(practice_stimuli_congruent);
    // console.log(practice_stimuli_incongruent);
    // console.log(practice_stimuli_neutral);
}

// repeat each stimulus reps times
var stimuli_shuffled = jsPsych.randomization.repeat(stimuli_unique, stimuli_repetitions);  // repeat and shuffle
if (no_incongruent_neighbors) { // ensure incongruent stimuli aren't presented consecutively
    function equality_test(a, b) {
        if (a.trialtype != 'incongruent') {
            return false;  // ignore if it's not incongruent trialtype
        } else {
            return a.trialtype === b.trialtype;  // return true if neighbors are both incongruent
        }
    }
    var stimuli_shuffled = jsPsych.randomization.shuffleNoRepeats(stimuli_shuffled, equality_test);
}
if (debug) { console.log(stimuli_shuffled); }

// evenly add each type of trial to practice stimuli array
var practice_stimuli_shuffled = [];
for (i = 0; i < (Math.floor(practice_trials / 3)); i++) {
    practice_stimuli_shuffled.push(practice_stimuli_congruent[i], practice_stimuli_incongruent[i], practice_stimuli_neutral[i]);
}

if (no_incongruent_neighbors) { // ensure incongruent stimuli aren't presented consecutively
    var practice_stimuli_shuffled = jsPsych.randomization.shuffleNoRepeats(practice_stimuli_shuffled, equality_test);
} else {
    jsPsych.randomization.shuffleNoRepeats(practice_stimuli_shuffled);  // shuffle
}

if (debug) { console.log(practice_stimuli_shuffled); }

// add data to all trials
jsPsych.data.addProperties({
    subject: subject,
    condition: condition,
    task: task,
    experiment: experiment,
    adaptive: adaptive,
    browser: navigator.userAgent, // browser info
    datetime: Date(),
});

var timeline = [];
var n_trial = 0; // stroop trial number counter

if (fullscreen) {
    timeline.push({
        type: "fullscreen",
        fullscreen_mode: true,
        message: generate_html("The experiment will switch to full screen mode when you press the button below", font_colour)
    });
}

var instructions = {
    type: "instructions",
    pages: [
        generate_html("Welcome!", font_colour) + generate_html("Click next or press the right arrow key to proceed.", font_colour),
        generate_html("In this task, you'll have to select the correct font colour for each of the words shown.", font_colour) + generate_html("If you see red coloured text, press 'r'; if you see blue coloured text, press 'b'; if you see yellow coloured text, press 'y';", font_colour),
        generate_html("For example, you'll see:", font_colour) + generate_html("red", "red") + generate_html("And the correct response would be pressing 'r'.", font_colour),
        generate_html("You have a limited amount of time to respond to each prompted word, so react quickly!", font_colour),
        generate_html("Next up is a practice trial.", font_colour) + generate_html("Your data will NOT be recorded.", font_colour) + generate_html("Click next or press the right arrow key to begin.", font_colour)
    ],
    show_clickable_nav: true,
    show_page_number: true,
};

var instructions2 = {
    type: "instructions",
    pages: [
        generate_html("That was the practice trial.", font_colour) + generate_html("Click next or press the right arrow key to begin the experiment.", font_colour) + generate_html("Your data WILL be recorded this time.", font_colour)
    ],
    show_clickable_nav: true,
    show_page_number: false,
    on_finish: function() {
        n_trial = 0;
    }
};


var fixation = {
    type: "image-keyboard-response",
    choices: jsPsych.NO_KEYS,
    stimulus: function () {
        if (black_background) {
            return "../../tasks/stroop/fixation_black.png"
        } else {
            return "../../tasks/stroop/fixation_white.png"
        }
    },
    stimulus_height: 30,
    stimulus_width: 30,
    trial_duration: fixation_duration,
    data: { event: 'fixation' },
    on_finish: function (data) {
        data.n_trial = n_trial;
    },
};

var correct_key = ''; // correct key on each trial
var current_iti = 0; // iti on each trial
var stimulus_event = null; // the event of the trial
var stimulus = {
    type: "html-keyboard-response",
    choices: Object.values(color_key), // get all the values (drop the keys) in the object color_key
    stimulus: function () {
        var text = jsPsych.timelineVariable('data', true).text;  // e.g., stimulus_shuffled[i].data.text
        var color = jsPsych.timelineVariable('data', true).color; // e.g., stimulus_shuffled[i].data.color 
        var trialtype = jsPsych.timelineVariable('data', true).trialtype;  // e.g., stimulus_shuffled[i].data.trialtype
        correct_key = color_key[color];
        if (debug) {
            console.log("trial " + n_trial + "; text: " + text + "; color: " + color + "; " + trialtype + ' (correct key: ' + correct_key + ")");
        }
        text_html = generate_html(text, color, 100);
        return text_html;
    },
    trial_duration: function () { return rt_deadline; }, // function is needed to dynamically change value on each trial
    data: jsPsych.timelineVariable('data'),  // all data inside the 'data' attribute of our timeline variable (stimuli_shuffled) will be saved to the json file
    on_start: function () {
        stimulus_event = 'stimulus';
    },
    on_finish: function (data) {
        data.event = stimulus_event;
        data.key_press = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.key_press);
        data.n_trial = n_trial;
        data.rt_deadline = rt_deadline;
        if (data.key_press == correct_key) {
            data.acc = 1;
        } else {
            data.acc = 0;
        };
        if (debug) {
            console.log("The event of this trial is: " + stimulus_event);
            console.log("Accuracies so far: " + jsPsych.data.get().filterCustom(function(trial){return trial.event == stimulus_event}).select('acc').values);
        }
        if (adaptive && n_trial > 0) {
            var previoustrials_acc = jsPsych.data.get().filterCustom(function(trial){return trial.event == stimulus_event}).last(2).select('acc').sum(); // get last two trials
            if (debug) {
                console.log("Previous trials' summed accuracy: " + previoustrials_acc);
            }
            if (previoustrials_acc > 1 && rt_deadline >= 250) {
                rt_deadline -= 50; // algorithm: reduce rt_deadline if last two trials' acc == 1 (i.e., sum of the last two trial's acc == 2), but make sure rt_deadline is never lower than 200
            } else if (data.acc == 0) {
                rt_deadline += 50; // increase rt_deadline by 50 ms if acc == 0
            };
        }
        if (debug) {
            console.log("response: " + data.key_press + "; acc: " + data.acc + "; next trial rt_deadline: " + rt_deadline);
        };
        n_trial += 1;
        current_iti = random_choice(itis);  // select an iti for this trial (to be presented later)
        data.iti = current_iti; // save iti in data
    },
}

var feedback = { // if correct (acc > 0), "correct, 456 ms"; if wrong (acc < 1), "wrong, 600 ms"; if no response (rt === null && acc < 1), "respond faster"
    type: "html-keyboard-response",
    stimulus: function () {
        last_trial_data = jsPsych.data.getLastTrialData();
        if (last_trial_data.select('acc').values[0] > 0) {
            var prompt = "correct, your reaction time was " + Math.round(last_trial_data.select('rt').values[0]) + " ms";
        } else {
            if (last_trial_data.select('key_press').values[0]) {
                var prompt = "wrong";
            } else {
                var prompt = "respond faster";
            }
        }
        return generate_html(prompt, font_colour, 25);
    },
    choices: jsPsych.NO_KEYS,
    trial_duration: feedback_duration,
    data: { event: "feedback" },
    post_trial_gap: function () { return current_iti },  // present iti after one timeline/trial
}

var trial_sequence = {
    timeline: [fixation, stimulus, feedback], // one timeline/trial has these objects
    timeline_variables: stimuli_shuffled, // the above timeline/trial is repeated stimuli_shuffled.length times
};

var practice_stimulus = jsPsych.utils.deepCopy(stimulus);
delete practice_stimulus.on_start;
practice_stimulus.on_start = function () {
    stimulus_event = "practice";
}

var practice_trial_sequence = {
    timeline: [fixation, practice_stimulus, feedback], // one timeline/trial has these objects
    timeline_variables: practice_stimuli_shuffled, // the above timeline/trial is repeated stimuli_shuffled.length times
};

timeline.push(instructions, practice_trial_sequence, instructions2, trial_sequence);

jsPsych.init({
    timeline: timeline,
    on_finish: function () {
        document.body.style.backgroundColor = 'white';
        var data_subset = jsPsych.data.get().filter({ "event": "stimulus" });  // select stroop trials
        var ddm_params = fit_ezddm_to_jspsych_data(data_subset);  // fit model
        jsPsych.data.get().addToAll({ // add objects to all trials
            info_: info_,
            datasummary_: {},
            total_time: datasummary_.total_time,
            ddm_params: ddm_params
        });
        if (debug) {
            jsPsych.data.displayData();
            console.log("ez-ddm parameters");
            console.log(ddm_params);
        }
        sessionStorage.setObj('info_', info_); // save to sessionStorage
        submit_data(jsPsych.data.get().json(), false);
    }
});