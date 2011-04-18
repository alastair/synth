// operator.js
//  A single oscillator
//
// MUMT307 project - Alastair Porter

Operator = function(element, options) {
    var defaults = {
            active: true,
            hidden: false,
            id: 0,
            freqRatio: 1,
    };

    var el;

    var settings = $.extend({}, defaults, options);

    // Show and hide the operator box on the screen
    function _hide() {
            settings.hidden = true;
            el.hide();
    }
    function _show() {
            settings.hidden = false;
            el.show();
    }

    // Turn this operator on/off
    function _setPower(value) {
        if (value) {
            settings.active = true;
            el.css({"background": ""});
            $('#o'+settings.id+'power').text("Turn off");
        } else {
            settings.active = false;
            el.css({"background": "gray"});
            $('#o'+settings.id+'power').text("Turn on");
        }
    }

    function _updateRatio(value) {
        settings.freqRatio = value;
    }

    function _setup() {
        el = $('#operator'+settings.id);
        _fillForm();
        _show();
    }

    function _fillForm() {
        $('#freqratio'+settings.id).val(settings.freqRatio);
        _setPower(settings.active);
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
        togglePower: function() {
            _setPower(!settings.active);
        },
        updateRatio: function(value) {
            _updateRatio(value);
        },
        load: function(newsettings) {
            settings = newsettings;
            _setup();
        },
        getSettings: function() {
            return settings;
        },
        fillForm: function() {
            _fillForm();
        }
    };
};
