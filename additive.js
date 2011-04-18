// additive.js
//  Simple additive synthesis
//
// MUMT307 project - Alastair Porter

// Adapted from the dsp.js ADSR envelope
// Only generates attack, decay and sustain
// Release happens when the mouse is unclicked
function getEnvelopeLevel(samplesProcessed, startLevel, attackLevel, attack, decay, sustainLevel) {
  var amplitude = 0;

  if (samplesProcessed <= attack ) {
    amplitude = 0 + (attackLevel - startLevel) * ((samplesProcessed - 0) / (attack - 0));
  } else if (samplesProcessed > attack && samplesProcessed <= decay ) {
    amplitude = 1 + (sustainLevel - attackLevel) * ((samplesProcessed - attack) / (decay - attack));
  } else if (samplesProcessed > decay) {
    amplitude = sustainLevel;
  }
 
  return amplitude;
};

function makeAdditive(frequency, bufferSize) {
    var sampleRate = 44100;

    var ops = [];
    var envs = [];
    for (var i = 0; i < 4; i++) {
        var oper = $('#operator'+(i+1)).operator();
        var env = $('#envelope'+(i+1)).envelope();
        // Only take the operator and envelope if it's active
        if (oper.getSettings().active) {
            ops.push(oper.getSettings().freqRatio);
            envs.push(env.getSettings());
        }
    }

    if (ops.length > 0) {
        startSample = currentSoundSample;
        var ret = new Float32Array(bufferSize);

        // Make Envelope
        e = envs[0];
        startLevel = e.l1/100.0;
        attackLevel = e.l2/100.0;
        sustainLevel = e.l3/100.0;
        attack = e.r1 * (sampleRate / 1000);
        decay = e.r2 * (sampleRate / 1000);

        var k = 2* Math.PI * frequency * ops[0] / sampleRate;
        for (var i=0, size=ret.length; i<size; i++) {
            amp = getEnvelopeLevel(currentSoundSample, startLevel, attackLevel, attack, decay, sustainLevel);
            ret[i] = Math.sin(k * currentSoundSample++) * amp;
        }

        if (ops.length > 1) {
            for (var o = 1; o < ops.length; o++) {
                var sample = startSample
                var k = 2* Math.PI * frequency * ops[o] / sampleRate;
                e = envs[o];
                startLevel = e.l1/100.0;
                attackLevel = e.l2/100.0;
                sustainLevel = e.l3/100.0;
                attack = e.r1 * (sampleRate / 1000);
                decay = e.r2 * (sampleRate / 1000);
                for (var i=0, size=ret.length; i<size; i++) {
                    amp = getEnvelopeLevel(sample, startLevel, attackLevel, attack, decay, sustainLevel);
                    ret[i] += Math.sin(k * sample++) * amp;
                }
            }
        }

        return ret;
    }
    return [];
}
