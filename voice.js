// voice.js
//  A voice is a named set of oscillators and envelopes
//
// MUMT307 project - Alastair Porter

var numOps = 4;

var Voice = function(element, options) {
    var defaults = {
        name: "",
        algorithm: 1,
        mode: "FM",
        id: 0,
    };

    var operators = [];
    var envelopes = [];

    var settings = $.extend({}, defaults, options);

    // Push this voice's settings into the form
    function _fillForm() {
        $('#voicename').val(settings.name);
        $('#voicealgorithm').val(settings.algorithm);
        if (settings.mode == "FM") {
            $('#synthmodeadd').removeAttr('checked');
            $('#synthmodefm').attr('checked', 'true');
        } else if (settings.mode == "Additive") {
            $('#synthmodefm').removeAttr('checked');
            $('#synthmodeadd').attr('checked', 'true');
        }
        for (var i = 0; i < numOps; i++) {
            $('#operator'+(i+1)).data('operator', operators[i]);
            $('#operator'+(i+1)).operator().setup();
            $('#envelope'+(i+1)).data('envelope', envelopes[i]);
            $('#envelope'+(i+1)).envelope().setup();
        }
    }

    function _getSettings() {
        var envs = [];
        for (e in envelopes) {
            envs[e] = envelopes[e].getSettings();
        }
        var ops = [];
        for (o in operators) {
            ops[o] = operators[o].getSettings();
        }
        var d = $.extend({}, settings, {operators: ops, envelopes: envs});
        return d;
    }

    function _updateSynth() {
        $('#synth').synth().updateVoice(settings.id, settings.name);
    }

    // Public methods
    return {
        setup: function() {  // args: operators, envelopes
            if (settings.name === "") {
                settings.name = "New voice " + settings.id;
            }
            for (var i = 0; i < numOps; i++) {
                if (arguments.length > 0) {
                    opargs = arguments[0][i];
                    envargs = arguments[1][i];
                } else {
                    opargs = {id: i+1, freqRatio:2};
                    envargs = {id: i+1};
                }
                operators[i] = new Operator(null, opargs);
                operators[i].setup();
                envelopes[i] = new Envelope(null, envargs);
                envelopes[i].setup();
            }
        },
        setVoiceName: function(newname) {
            settings.name = newname;
            _updateSynth();
        },
        setSynthMode: function(newmode) {
            settings.mode = newmode;
        },
        getSynthMode: function() {
            return settings.mode;
        },
        setAlgorithm: function(newalgo) {
            settings.algorithm = newalgo;
        },
        finishEditing: function() {
            $('#voice').hide();
        },
        getSettings: function() {
            return _getSettings();
        },
        fillForm: function() {
            _fillForm();
        }
    };
};
