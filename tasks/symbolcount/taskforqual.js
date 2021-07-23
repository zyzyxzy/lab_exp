// DEFINE TASK (required)
var taskinfo = {
    type: 'task', // 'task', 'survey', or 'study'
    uniquestudyid: 'symbolcount', // unique task id: must be IDENTICAL to directory name
    description: 'symbol counting task', // brief description of task
    condition: null, // experiment/task condition
    redirect_url: "/tasks/symbolcount/viz" // set to false if no redirection required
};

var info_ = create_info_(taskinfo);  // initialize subject id and task parameters
if (info_.subject && info_.time) {
    taskinfo.redirect_url = taskinfo.redirect_url + '?id=' + info_.subject + '&time=' + info_.time;
}
const debug = false;  // true to print messages to console and display json results
var font_colour = "black";
var background_colour = "white";
set_colour(font_colour, background_colour);

// DEFINE TASK PARAMETERS (required)
const trials = 10;               // the total number of trials 
const practice_trials = 2;
const max_tasktime_minutes = 5;   // maximum task time in minutes (task ends after this amount of time regardless of how many trials have been completed)
var reps = 12;                  // the number of symbols per trial
var difficulty = 1;   // task difficult (1, 2, 3, 4, or 5; 5 is most difficult)
var adaptive = true;  // adjust difficulty based on accuracy (true/false) (if true, reps and difficulty will be overwritten by difficulty_reps_steps[current_idx])
var show_performance = true;  // if true, also show subject counts on feedback page
var show_overall_performance = true; // whether to show overall performance at the end
var symbol_duration = 1000;      // each symbol appears for this duration (ms) 
var fixation_duration = 500;  // fixation duration
var inter_symbol_duration = 400;  // gap between consecutive symbols

if (debug) {
    symbol_duration = 100;
    inter_symbol_duration = 0;
}

// parameters below typically don't need to be changed
var n_trial = -1; // current trial number counter
var n_rep = 0; // current rep counter
var n_dollar = 0;  // dollar counter on each triial
var n_hash = 0;  // hash counter on each trial
var itis = iti_exponential(low = 100, high = 5000);  // generate array of ITIs
var choices = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
var responses = [];  // subject's response on each trial $ and #
var switch_intensity = { 1: 2.4, 2: 2.2, 3: 1.8, 4: 1.5, 5: 1.3 }; // task difficulty parameters

// set up adaptive procedure
if (adaptive) {
    var difficulty_min_max = [1, 5];  // difficulty ranges from 1 to 5 (see switch_intensity)
    var reps_min_max = [11, 17]; // specify min/max symbols (reps) to present on each trial
    var difficulty_reps_steps = combine(difficulty_min_max, reps_min_max); // array of arrays of [difficulty, reps]
    var current_idx = 1; // initial difficulty level; can be any value from 0 (easiest) to difficult_reps_steps.length;     
    // overwrite reps and difficulty variables set earlier on
    difficulty = difficulty_reps_steps[current_idx][0];
    reps = difficulty_reps_steps[current_idx][1];
    console.log("difficulty_reps_steps");
    console.log(difficulty_reps_steps);
    console.log("initial difficulty: " + difficulty);
    console.log("initial reps: " + reps);
}

jsPsych.data.addProperties({  // do not edit this section unnecessarily!
    subject: info_.subject,
    type: taskinfo.type,
    uniquestudyid: taskinfo.uniquestudyid,
    description: taskinfo.description,
    condition: taskinfo.condition,
});

// function to determine switch reps on each trial; returns an array of length reps, with integers (0, 1) indicating which symbol to present
function determine_sequence(reps, symbols, trial_difficulty, verbose) {
    var switches = Math.floor(reps / switch_intensity[trial_difficulty]); // determine no. of switches
    var switch_trial_idx = range(1, reps - 1); // omit first and last reps (they never switch)
    // randomly pick four trial indices to switch ats 
    switch_trial_idx = jsPsych.randomization.shuffle(switch_trial_idx);
    switch_trial_idx = switch_trial_idx.slice(0, switches);
    n_symbols = range(0, symbols.length); // generate indices for each symbol
    // for loop to determine symbol on each rep 
    var sequence = [];
    for (i = 0; i < reps; i++) {
        if (i == 0) { // randomly determine first symbol
            n_symbol = random_choice(n_symbols);
            sequence.push(n_symbol);
        } else { // determine subsequent symbols
            if (switch_trial_idx.includes(i)) { // if switch, change symbol
                other_symbols = n_symbols.filter(function (x) {
                    return x != n_symbol;
                });
                n_symbol = random_choice(other_symbols);
            }
            sequence.push(n_symbol);
        }
    }
    if (verbose && debug) {
        console.log(sequence);
    }
    return sequence;
}

// function that creates a nested array of [switch intensity, reps]
function combine(a1, a2) {
    let x = [];
    for (let i = a1[0]; i <= a1[1]; i++) {
        for (let j = a2[0]; j <= a2[1]; j++) {
            x.push([i, j]);
        }
    }
    return x;
}

// function to determine the level of difficulty of the next trial depending on the accuracy of the current trial
function update_difficulty(overall_acc) {
    if (overall_acc > 0.5) {
        if (current_idx < difficulty_reps_steps.length - 1) {
            current_idx += 1;
        }
        difficulty = difficulty_reps_steps[current_idx][0];
        reps = difficulty_reps_steps[current_idx][1];
        symbol_duration = Math.max(symbol_duration - 1000 / 60 * 2, 400); // reduce symbol duration (min 400ms)
    }
    else {
        if (current_idx > 0) {
            current_idx -= 1;
        }
        difficulty = difficulty_reps_steps[current_idx][0];
        reps = difficulty_reps_steps[current_idx][1];
        symbol_duration = Math.min(symbol_duration + 1000 / 60 * 2, 1000); // increase symbol duration (max 400 ms)
    }
}

var instructions = {
    type: "instructions",
    pages: [
        generate_html("Welcome!", font_colour) + generate_html("Click next or press the right arrow key to proceed.", font_colour),
        generate_html("In this task, you'll see sequences of black squares (&#9632;) and white circles (&#9675;)", font_colour) + generate_html("Your goal is to keep a count of each of the two types of symbols.", font_colour),
        generate_html("Next up is a practice trial.", font_colour) + generate_html("Your data will NOT be recorded.", font_colour) + generate_html("Click next or press the right arrow key to begin.", font_colour)],
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
};

var symbols = [ // define symbols
    { symbol: "<div style='font-size:200px;'>&#9632;</div>" },
    { symbol: "<div style='font-size:200px;'>&#9675;</div>" }
];

var fixation = { // define fixation
    type: "image-keyboard-response",
    // stimulus: "<div style='font-size:30px;'>&#9679</div>", // dot as fixation
    stimulus: "../../tasks/symbolcount/fixation_white.png", // dot as fixation
    stimulus_height: 30,
    stimulus_width: 30,
    choices: jsPsych.NO_KEYS,
    trial_duration: fixation_duration,
    data: {
        event: 'fixation',
    },
    on_finish: function (data) {
        responses = [];
        n_rep = -1;  // reset symbol repeition counter
        n_trial += 1;
        data.n_trial = n_trial; // save current trial
        if (debug) {
            console.log("trial " + n_trial);
        }
    },
};

var symbols_sequence = { // determine sequence of symbols within a trial
    timeline: [
        {
            type: "html-keyboard-response",
            stimulus: jsPsych.timelineVariable("symbol"),
            choices: jsPsych.NO_KEYS,
            trial_duration: function () { return symbol_duration }, // function is needed to dynamically change value on each trial
            post_trial_gap: inter_symbol_duration,
            data: { event: 'symbol' },
            on_finish: function (data) {
                n_rep += 1;
                data.n_rep = n_rep;
                data.n_trial = n_trial;
                n_dollar = jsPsych.data.get().filter({ stimulus: symbols[0]['symbol'], n_trial: n_trial }).count();
                data.n_dollar = n_dollar;
                n_hash = jsPsych.data.get().filter({ stimulus: symbols[1]['symbol'], n_trial: n_trial }).count();
                data.n_hash = n_hash;
                data.rep = reps;
                data.difficulty = difficulty;
                data.symbol_duration = symbol_duration;
                if (debug) {
                    console.log("n_dollar: " + n_dollar);
                    console.log("n_hash: " + n_hash);
                }
            }
        }
    ],
    timeline_variables: symbols,
    sample: { // custom sampling function to generate pseudorandom sequence of symbols on each trial
        type: 'custom',
        fn: function (samples) {
            samples = determine_sequence(reps, samples, difficulty, true);
            return samples;
        }
    },
};

var response = { // collect response from subject
    timeline: [
        {
            type: 'html-button-response',
            choices: choices,
            stimulus: jsPsych.timelineVariable('symbol')
        }
    ],
    timeline_variables: [
        { symbol: '<div style="transform: translateY(-30px); font-size:25px;"> How many &#9632; symbols </div>' },
        { symbol: '<div style="transform: translateY(-30px); font-size:25px;"> How many &#9675; symbols </div>' }
    ],
    data: { event: "response" },
    on_finish: function (data) {
        // push last button press to responses array
        responses.push(parseInt(choices[parseInt(jsPsych.data.get().last(1).values()[0].button_pressed)]));
        if (debug) {
            console.log(responses);
        }
        data.n_trial = n_trial;
    },
};

var feedback = { // show feedback to subject
    type: "html-button-response",
    stimulus: function () {
        text = "<p>Actual counts</p><p>" + n_dollar + " &#9632; and " + n_hash + " &#9675;<p></p>";
        if (show_performance) {
            counts = "<p>Your counts</p><p>" + responses[0] + " &#9632; and " + responses[1] + " &#9675;<p></p>";
            text = counts + text;
        }
        return "<div style='font-size:25px;'>" + text + "</div>";
    },
    choices: ['Continue'],
    data: { event: 'feedback' },
    post_trial_gap: function () { return random_choice(itis) }, // randomly select one ITI
    on_finish: function (data) {
        data.n_rep = n_rep;
        data.n_trial = n_trial;
        data.n_dollar = n_dollar;
        data.n_hash = n_hash;
        data.n_dollar_response = responses[0];
        data.n_hash_response = responses[1];
        acc_dollar = + (n_dollar == responses[0]);
        acc_hash = + (n_hash == responses[1]);
        overall_acc = (acc_dollar + acc_hash) / 2;
        data.acc_dollar = acc_dollar;
        data.acc_hash = acc_hash;
        data.acc = overall_acc;
        data.rep = reps;
        data.difficulty = difficulty;
        data.symbol_duration = symbol_duration;
        if (adaptive) {
            update_difficulty(overall_acc);
        }
        if (debug) {
            console.log(reps);
            console.log(difficulty);
            console.log(symbol_duration);
        }
    },
};

var trial = { // events in a trial
    timeline: [fixation, symbols_sequence, response, feedback], // events in each trial
    repetitions: trials, // total number of trials to present
    conditional_function: function () { // skip this object/timeline if time has elapsed
        var max_tasktime_ms = max_tasktime_minutes * 60 * 1000;
        var start_time = jsPsych.data.get().first().select('time_elapsed').values[0];
        var current_time = jsPsych.data.get().last().select('time_elapsed').values[0];
        var elapsed_time = current_time - start_time;
        if (debug) { console.log('elapsed time: ' + elapsed_time); };
        if (elapsed_time > max_tasktime_ms) {
            return false;
        } else {
            return true;
        }
    }
}; 

var debrief_block = {
    type: "html-button-response",
    choices: ['Finish'],
    stimulus: function () {
        var html = "<p>Click the Finish button below to end the experiment. Thank you! </p>";
        if (show_overall_performance) {
            var trials = jsPsych.data.get().filter({ "event": "feedback" });
            var correct_trials = trials.filter({ "acc": 1 });
            var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
            html = "<p>You responded correctly on " + accuracy + "% of the trials.</p>" + html;
        }
        return html;
    }
}; 

var practice_feedback = jsPsych.utils.deepCopy(feedback);
delete practice_feedback.data;
practice_feedback.data = {event: 'practice'}

var practice_trial = jsPsych.utils.deepCopy(trial);
delete practice_trial.timeline;
delete practice_trial.repetitions;
practice_trial.timeline = [fixation, symbols_sequence, response, practice_feedback]
practice_trial.repetitions = practice_trials

// create timeline and events/objects for study (the first next lines are always the same! consent then check whether it's same person)
var timeline = [];
//timeline = create_consent(timeline, taskinfo);
//timeline = check_same_different_person(timeline);

timeline.push(instructions);
timeline.push(practice_trial);
timeline.push(instructions2);
timeline.push(trial);
timeline.push(debrief_block);
timeline = create_demographics(timeline);


// Make timeline accessible from Qualtrics JavaScript
window.symbolCountTimeline = timeline;