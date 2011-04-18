// envelope.js
//  Creation of oscillator envelopes
//
// MUMT307 project - Alastair Porter

var Envelope = function(element, options) {
    var defaults = {
        hidden: true,

        l1: 0,
        l2: 99,
        l3: 70,
        l4: 0,
        r1: 20,
        r2: 20,
        r3: 100, // Hidden "sustain"
        r4: 20
    };

    var el;
    var canvas;

    var settings = $.extend({}, defaults, options);

    function _hide() {
            settings.hidden = true;
            el.hide();
    };
    function _show() {
            settings.hidden = false;
            el.show();
    };

    /**
     * Fill out the form for this envelope based on the
     * settings.
     */
    function _fillForm() {
        i = settings.id;
        $('#e'+i+'l1').val(settings.l1);
        $('#e'+i+'l2').val(settings.l2);
        $('#e'+i+'l3').val(settings.l3);
        $('#e'+i+'l4').val(settings.l4);
        $('#e'+i+'r1').val(settings.r1);
        $('#e'+i+'r2').val(settings.r2);
        $('#e'+i+'r3').val(settings.r3);
        $('#e'+i+'r4').val(settings.r4);
    };

    function _setEnvelope(l1, l2, l3, l4, r1, r2, r3, r4) {
        settings.l1 = l1;
        settings.l2 = l2;
        settings.l3 = l3;
        settings.l4 = l4;
        settings.r1 = r1;
        settings.r2 = r2;
        settings.r3 = r3;
        settings.r4 = r4;
    }

    function _initCanvas() {
        canvas = $('#envelope'+settings.id+'canvas');
    }

    function _drawEnvelope() {
        canvas.each(function(i, c) {
            c.width = c.width; // reset
            context = c.getContext("2d");
            x = 0;
            y = 100-settings.l1;
            context.moveTo(x, y);

            x = settings.r1 / 2;
            y = 100-settings.l2;
            context.lineTo(x, y);

            x = (0 + settings.r1 + settings.r2)/2;
            y = 100-settings.l3;
            context.lineTo(x, y);
            
            x = (0 + settings.r1 + settings.r2 + settings.r3)/2;
            context.lineTo(x, y);
            
            x = (0 + settings.r1 + settings.r2 + settings.r3 + settings.r4)/2;
            y = 100-settings.l4;
            context.lineTo(x, y);

            context.stroke();
        });
    }

    function _setup() {
        settings.idName = '#envelope'+settings.id;
        el = $(settings.idName);
        _hide();
        _fillForm();
        _initCanvas();
        _drawEnvelope();
    }

    // Public methods
    return {
        setup: function() {
            _setup();
        },
        swap: function() {
            if (settings.hidden) {
                _show();
            } else {
                _hide();
            }
        },
        hide: function() {
            _hide();
        },
        show: function() {
            _show();
        },
        fillForm: function() {
            _fillForm();
        },
        setEnvelope: function(l1, l2, l3, l4, r1, r2, r3, r4) {
            _setEnvelope(l1, l2, l3, l4, r1, r2, r3, r4);
        },
        drawEnvelope: function() {
            _drawEnvelope();
        },
        load: function(newsettings) {
            settings = newsettings;
            _setup();
        },
        getSettings: function() {
            return settings;
        }
    };
};
