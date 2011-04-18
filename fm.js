// fm.js
//  FM synthesis
//
// MUMT307 project - Alastair Porter

function makeFM(frequency, bufferSize) {
    var sampleRate = 44100;

    var ops = [];
    var envs = [];
    // FM only uses the first 2 operators, regardless of
    //  if they are on or not
    for (var i = 0; i < 2; i++) {
        var oper = $('#operator'+(i+1)).operator();
        var env = $('#envelope'+(i+1)).envelope();
        ops.push(oper.getSettings().freqRatio);
        envs.push(env.getSettings());
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
        var modulator = new Float32Array(bufferSize);
        for (var i=0, size=ret.length; i<size; i++) {
            amp = getEnvelopeLevel(currentSoundSample, startLevel, attackLevel, attack, decay, sustainLevel);
            modulator[i] = Math.sin(k * currentSoundSample++) * amp;
        }

        if (ops.length > 1) {
            for (var o = 1; o < ops.length; o++) {
                var sample = startSample
                e = envs[o];
                startLevel = e.l1/100.0;
                attackLevel = e.l2/100.0;
                sustainLevel = e.l3/100.0;
                attack = e.r1 * (sampleRate / 1000);
                decay = e.r2 * (sampleRate / 1000);
                for (var i=0, size=ret.length; i<size; i++) {
                    var k = 2* Math.PI * (modulator[i] + ops[o]) / sampleRate;
                    amp = getEnvelopeLevel(sample, startLevel, attackLevel, attack, decay, sustainLevel);
                    ret[i] = Math.sin(k * sample++) * amp;
                }
            }
        }

        return ret;
    }
    return [];
}
