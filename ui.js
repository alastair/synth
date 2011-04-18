// ui.js
//  hooks up inputs on the html page to javascript models
//
// MUMT307 project - Alastair Porter

var numOperators = 4;

// Convert the field of an envelope input
// to a number, replacing an empty string
// by 0
var toNum = function(v) {
    if (v == "") {
        return 0;
    }
    return parseInt(v);
};

// If firebug is not installed, create all of the debug methods
if (!window.console || !console.firebug)
{
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}

$(document).ready(function() {
    $('#synth').synth();

    // Pressing a keyboard key
    $(".key").mousedown(function(event) {
        if (event.target.id[0] == "m" && event.button == 0) {
            midi = event.target.id.substring(1);
    		$('#synth').synth().startMidi(midi);
        }
    });

    $(".key").mouseup(function(event) {
        if (event.button == 0) {
            $('#synth').synth().stopMidi();
        }
    });
    for (i = 1; i <= numOperators; i++) {
        // Switch between operator/envelope
        (function(num) {
            $('#swape'+num).click(function(event) {
                event.preventDefault();
                $('#envelope'+num).envelope().swap();
                $('#operator'+num).operator().swap();
            });
        })(i);
        (function(num) {
            $('#swapo'+num).click(function(event) {
                event.preventDefault();
                $('#operator'+num).operator().swap();
                $('#envelope'+num).envelope().swap();
            });
        })(i);

        // Keypresses on envelope
        (function(num) {
            $('.e'+num+'val').keydown(function(event) {
                c = event.keyCode;
                if ((c >= 65 && c <= 90 && !event.metaKey) || c == 109) {
                  // no letters, no minus (-)
                  event.preventDefault();
                } else {
                    v = event.target.value;
                    if (v.length == 2 && c >= 48 && c <= 57) {
                        // Only 0-99
                        // XXX: Can't highlight 2 numbers and overwrite
                        //event.preventDefault();
                    }
                }
            });
        })(i);

        (function(num) {
            $('.e'+num+'val').keyup(function(event) {
                l1 = toNum($('#e'+num+'l1').val());
                l2 = toNum($('#e'+num+'l2').val());
                l3 = toNum($('#e'+num+'l3').val());
                l4 = toNum($('#e'+num+'l4').val());
                r1 = toNum($('#e'+num+'r1').val());
                r2 = toNum($('#e'+num+'r2').val());
                r3 = toNum($('#e'+num+'r3').val());
                r4 = toNum($('#e'+num+'r4').val());
                $('#envelope'+num).envelope().setEnvelope(l1, l2, l3, l4, r1, r2, r3, r4);
                $('#envelope'+num).envelope().drawEnvelope();
            });
        })(i);

        // Frequency ratio
        (function(num) {
            $('#freqratio'+num).keyup(function(event) {
                $('#operator'+num).operator().updateRatio(event.target.value);
            });
        })(i);

        // Power switch
        (function(num) {
            $('#o'+num+'power').click(function(event) {
                $('#operator'+num).operator().togglePower('#o'+num+'power');
            });
        })(i);
    }

    $('#addvoice').click(function(event) {
        $('#synth').synth().addVoice();
    });

    $('#dumpvoices').click(function(event) {
        $('#synth').synth().dumpVoices();
    });

    $('#savelocal').click(function(event) {
        $('#synth').synth().saveLocal();
    });

    $('#loadlocal').click(function(event) {
        $('#synth').synth().loadLocal();
    });

    $('#savefile').click(function(event) {
        $('#synth').synth().saveFile();
    });

    $('#loadfile').click(function(event) {
        $('#synth').synth().loadFile();
    });

    $('#resetsynth').click(function(event) {
        $('#synth').synth().resetSynth();
    });

    $('#doneeditingvoice').click(function(event) {
        $('#voice').voice().finishEditing();
    });

    $('#voicename').keyup(function(event) {
        $('#voice').voice().setVoiceName(event.target.value);
    });

    $('#voicealgorithm').keyup(function(event) {
        $('#voice').voice().setAlgorithm(event.target.value);
    });

    $('#synthmodeadd').click(function(event) {
        $('#voice').voice().setSynthMode("Additive");
    });

    $('#synthmodefm').click(function(event) {
        $('#voice').voice().setSynthMode("FM");
    });
    $('#panic').click(function(event) {
        $('#synth').synth().stopMidi();
    });


    $('#displaytoggle').click(function(event) {
        if ($('#displaytoggle').text() == "Show display") {
            $('#visualdisplay').show()
            $('#displaytoggle').text("Hide display")
        } else { //hide
            $('#visualdisplay').hide()
            $('#displaytoggle').text("Show display")
        }
    });

});

// Plugin pattern by Jamie Talbot (http://jamietalbot.com)
(function($) {
    $.fn.synth = function(options) {
        return $.fn.encapsulatedPlugin('synth', Synth, this, options);
    };

    $.fn.voice = function(options) {
        return $.fn.encapsulatedPlugin('voice', Voice, this, options);
    };

    $.fn.envelope = function(options) {
        return $.fn.encapsulatedPlugin('envelope', Envelope, this, options);
    };

    $.fn.operator = function(options) {
        return $.fn.encapsulatedPlugin('operator', Operator, this, options);
    };

    $.fn.encapsulatedPlugin = function(plugin, definition, objects, options) {

    // Creates a function that calls the function of the same name on each member of the supplied set.
    function makeIteratorFunction(f, set) {
        return function () {
            var result = [];
            for ( var i = 0; i < set.length; i++) {
                result.push(set[i][f].apply(set[i][f], arguments));
            }
            return result[0];
        };
    }

        var result = [];
        objects.each(function() {
            var element = $(this);

            if (!element.data(plugin)) {
                // Initialise
                var instance = new definition(this, options);
                if (instance.setup) {
                    // If there is a setup function supplied, call it.
                    instance.setup();
                }

                // Store the new functions in a validation data object.
                element.data(plugin, instance);
            }
            result.push(element.data(plugin));
        });

        // We now have a set of plugin instances.
        result = $(result);

        // Take the public functions from the definition and make them available across the set.
        var template = result[0];
        if (template) {
            for ( var i in template) {
                if (typeof (template[i]) == 'function') {
                    result[i] = makeIteratorFunction(i, result);
                }
            }
        }

        // Finally mix-in a convenient reference back to the objects, to allow for chaining.
        result.$ = objects;

        return result;
    };
})(jQuery);

