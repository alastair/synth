// synth.js
//  synthesiser save/load/keyboard interaction
//
// MUMT307 project - Alastair Porter

var currentSoundSample = 0;

var Synth = function(element, options) {
    var defaults = {
        numvoices: 0,
        currentVoice: 0
    };

    var settings = $.extend({}, defaults, options);
    var voices = {};

    // Audio output object
    var output;
    // Sample Rate
    var sampleRate = 44100;
    var currentWritePosition = 0;
    var prebufferSize = sampleRate / 2; // buffer 500ms
    var tail = null, tailPosition;
    var intervalId;

    var prebufferSize = sampleRate * 0.020; // Initial buffer is 20 ms
    var autoLatency = true, started = new Date().valueOf();

    /**
     * Convert a midi note number to a frequency (A440)
    */
    function _midiToFreq(m) {
        semis = midi - 69;
        f = 440 * Math.pow(2, (semis/12.0));
        return f;
    }

    // This method almost verbatim from https://wiki.mozilla.org/Audio_Data_API
    // Plays the frequency 'freq' 
    function _playPitch() {
        f = freq;

        var written;
        // Check if some data was not written in previous attempts.
        if(tail) {
            written = output.mozWriteAudio(tail.subarray(tailPosition));
            currentWritePosition += written;
            tailPosition += written;
            if(tailPosition < tail.length) {
                // Not all the data was written, saving the tail...
                return; // ... and exit the function.
            }
            tail = null;
        }

        // Auto latency detection
        if (autoLatency) {
            prebufferSize = Math.floor(sampleRate * (new Date().valueOf() - started) / 1000);
            if (output.mozCurrentSampleOffset()) { // Play position moved?
                autoLatency = false;
            }
        }

        // Check if we need to add some data to the audio output.
        var currentPosition = output.mozCurrentSampleOffset();

        if (currentWritePosition > currentPosition) {
            currentWritePosition = currentPosition;
        }

        var available = currentPosition + prebufferSize - currentWritePosition;
        if(available > 0) {
            // Find the next power of 2 (so the FFT works)
            available = (available >> 1) | available;
            available = (available >> 2) | available;
            available = (available >> 4) | available;
            available = (available >> 8) | available;
            available = (available >> 16) | available;
            available += 1;
            // Request some sound data from the callback function.
            mode = $('#voice').voice().getSynthMode();
            if (mode === "Additive") {
                var soundData = makeAdditive(f, available);
            } else if (mode === "FM") {
                var soundData = makeFM(f, available);
            }

            // Paint the waveform/fft
            _drawSignal(soundData, f);
            written = output.mozWriteAudio(soundData);
            if(written < soundData.length) {
                // Not all the data was written, saving the tail.
                tail = soundData;
                tailPosition = written;
            }
            currentWritePosition += written;
        }
    }

    // When the mouse is pressed, start filling the synth buffer
    function _startPitch(f) {
        autoLatency = true;
        started = new Date().valueOf();
        currentSoundSample = 0;
        freq = f;
        intervalId = setInterval(_playPitch, 100);
    }

    // Stop playing when mouse is lifted
    function _stopPitch() {
        clearInterval(intervalId);
        tail = null;
        // XXX: Play decay
    }

    // Draw a signal's waveform and its FFT
    function _drawSignal(signal, frequency) {
        fft = new FFT(signal.length, 44100);
        fft.forward(signal);

        canvas = $('#signal');
        // Signal
        canvas.each(function(i, c) {
            c.width = c.width; // reset
            context = c.getContext("2d");

            
            scale = 20;
            firsty = scale + 100 - signal[0] * scale;
            context.moveTo(0, firsty);
            if (frequency > 1000) {
                skip = 1;
            } else if (frequency > 800) {
                skip = 2;
            } else {
                skip = 4;
            }
            cap = Math.min(500*4, signal.length);
            for ( var i = 0; i < cap; i+=skip ) {
                context.lineTo(i, scale + 100 - signal[i] * scale);
            }
            context.stroke();
        });

        // FFT
        canvas = $('#fft');
        canvas.each(function(i, c) {
            c.width = c.width; // reset
            context = c.getContext("2d");
            height = 200;
            firsty = height - 10 - fft.spectrum[0] * 512;
            context.moveTo(0, firsty);
            skip = Math.floor(fft.spectrum.length / 500);
            cap = Math.min(500*skip, fft.spectrum.length)
            for ( var i = 0; i < cap; i+=1 ) {
                context.lineTo(i/skip, height - 10 - fft.spectrum[i] * 64);
            }
            context.stroke();
        });
    }

    // Load a Synth that was stored as json
    function _loadSynth(newsynth) {
        for (voice in newsynth.voices) {
            _addVoice(newsynth.voices[voice]);
        }
        settings.numvoices = newsynth.numvoices;
        settings.currentVoice = newsynth.currentVoice;
        _selectVoice(settings.currentVoice);
    }

    function _setup() {
        if (!!new Audio() && !!new Audio().mozSetup) {
            output = new Audio();
            output.mozSetup(1, sampleRate, 1);
            $("#messages").html("We're ready to go!");
        } else {
            $("#messages").html("Sorry, you have no audio support. Please download Firefox 4.");
        }
        if (localStorage["synth"] === null) {
            _resetSynth();
        } else {
            _loadSynth($.evalJSON(localStorage["synth"]));
        }
    }

    // Load the default set of synths
    function _resetSynth() {
        _removeAllVoices();
        _loadSynth(synthDefaults)
    }

    // Add a new voice. If called with an argument, use the settings
    // in that argument. Otherwise make a new voice.
    function _addVoice() {
        if (arguments.length > 0) {
            voicename = arguments[0].name;
        } else {
            voicename = 'New voice '+settings.numvoices
        }
        $('#voicetable tbody').append(
            $('<tr>').attr('id', 'voicerow'+settings.numvoices).append(
                $('<td>').append($('<span>').attr('id', 'voice'+settings.numvoices).text(voicename))
            ).append(
                $('<td>').append($('<button>').attr('id', 'editvoice'+settings.numvoices).text('Edit voice'))
            ).append(
                $('<td>').append($('<button>').attr('id', 'selectvoice'+settings.numvoices).text('Select voice'))
            ).append(
                $('<td>').append($('<a>').attr('href', '#').attr('id', 'deletevoice'+settings.numvoices).text('[x]'))
            )
        );

        (function(num, loadargs) {
            if (loadargs.length > 0) {
                v = loadargs[0];
                voices[num] = new Voice(null, {id: v.id, algorithm:v.algorithm, mode: v.mode, 'name': v['name']});
                voices[num].setup(v.operators, v.envelopes);
            } else {
                voices[num] = new Voice(null, {id: num, algorithm:num});
                voices[num].setup();
            }

            $('#editvoice'+num).click(function(event) {
                $('#synth').synth().editVoice(num);
            });
            $('#deletevoice'+num).click(function(event) {
                event.preventDefault();
                $('#synth').synth().removeVoice(num);
            });
            $('#selectvoice'+num).click(function(event) {
                $('#synth').synth().selectVoice(num);
            });
        })(settings.numvoices, arguments);
        settings.numvoices += 1;
    }

    // Delete voices from the synth
    function _removeVoice(voice) {
        delete voices[voice];
        $('#voicerow'+voice).remove();
    }

    function _removeAllVoices() {
        for (v in voices) {
            _removeVoice(v);
        }
    }

    // Make a voice active in the synth
    function _selectVoice(n) {
        $('#voicerow'+settings.currentVoice).css('background', 'white');
        settings.currentVoice = n;
        $('#voicerow'+n).css('background', 'yellow');

        // Copy voice into the UI
        $('#voice').data('voice', voices[settings.currentVoice]);
        $('#voice').voice().fillForm();
    }

    // Public methods
    return {
        setup: function() {
            _setup()
        },
        addVoice: function() {
            _addVoice();
        },
        removeVoice: function(n) {
            _removeVoice(n);
        },
        selectVoice: function(n) {
            _selectVoice(n);
        },
        editVoice: function(n) {
            _selectVoice(n);
            $('#voice').show();
        },
        updateVoice: function(vid, newname) {
            voices[vid] = $('#voice').voice();
            $('#voice'+vid).text(newname);
        },
        saveLocal: function() {
            var v = {};
            for (voice in voices) {
                v[voice] = voices[voice].getSettings();
            }
            var d = $.extend({}, settings, {voices: v});
            localStorage["synth"] = $.toJSON(d);
        },
        loadLocal: function() {
            _removeAllVoices();
            _loadSynth($.evalJSON(localStorage["synth"]));
        },
        playMidi: function(midi) {
            _playPitch(_midiToFreq(midi));
        },
        dumpVoices: function() {
            //console.debug(voices);
        },
        resetSynth: function() {
            _resetSynth();
        },
        startMidi: function(midi) {
            _startPitch(_midiToFreq(midi));
        },
        stopMidi: function() {
            _stopPitch();
        }
    };
};
