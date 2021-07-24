Qualtrics.SurveyEngine.addOnload(function () {

    /*Place your JavaScript here to run when the page loads*/

    /* Change 2: Hiding the Next button */
    // Retrieve Qualtrics object and save in qthis
    var qthis = this;

    // Hide buttons
    qthis.hideNextButton();

    /* Change 3: Defining and load required resources */
    var jslib_url = "https://zyzyxzy.github.io/lab_exp/";

    // the below urls must be accessible with your browser
    // for example, https://kywch.github.io/jsPsych/jspsych.js
    var requiredResources = [
        jslib_url + "jspsych/jspsych.js",
        jslib_url + "jspsych/plugins/jspsych-image-keyboard-response.js",
		jslib_url + "libraries/jquery-3.5.1.min.js",
		jslib_url + "jspsych/plugins/jspsych-html-slider-response.js",
		jslib_url + "jspsych/plugins/jspsych-external-html.js",
		jslib_url + "jspsych/plugins/jspsych-html-keyboard-response.js",
		jslib_url + "jspsych/plugins/jspsych-instructions.js",
		jslib_url + "jspsych/plugins/jspsych-html-button-response.js",
		jslib_url + "jspsych/plugins/jspsych-survey-text-dropdown.js",
		jslib_url + "jspsych/plugins/jspsych-survey-text.js"
    ];

    function loadScript(idx) {
        console.log("Loading ", requiredResources[idx]);
        jQuery.getScript(requiredResources[idx], function () {
            if ((idx + 1) < requiredResources.length) {
                loadScript(idx + 1);
            } else {
                initExp();
            }
        });
    }

    if (window.Qualtrics && (!window.frameElement || window.frameElement.id !== "mobile-preview-view")) {
        loadScript(0);
    }

    /* Change 4: Appending the display_stage Div using jQuery */
    // jQuery is loaded in Qualtrics by default
		jQuery("<div id = 'display_stage_background'></div>").appendTo('body');
		jQuery("<div id = 'display_stage'></div>").appendTo('body');

		/* Change 5: Wrapping jsPsych.init() in a function */
		jsPsych.init({
		timeline: window.symbolCountTimeline,
		display_element: 'display_stage'
		on_finish: function () {
				document.body.style.backgroundColor = 'white';
				var trials = jsPsych.data.get().filter({ event: "feedback" });
				var correct_trials = trials.filter({ acc: 1 });
				var accuracy = Math.round(
					(correct_trials.count() / trials.count()) * 100
				);  
				jsPsych.data.get().addToAll({ // add parameters to all trials
					total_time: jsPsych.totalTime() / 60000,
				});
				if (debug) {
					jsPsych.data.displayData();
				}
				jQuery('#display_stage').remove();
				jQuery('#display_stage_background').remove();
				Qualtrics.SurveyEngine.setEmbeddedData("Accuracy", accuracy);
				Qualtrics.SurveyEngine.setEmbeddedData("Trials", trials.count());
				Qualtrics.SurveyEngine.setEmbeddedData("Correct_trials", correct_trials.count());
				qthis.clickNextButton();
			}
		});
});