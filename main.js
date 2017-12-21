window.addEventListener("load", function () {
    const c = document.createElement("canvas");
    let cw = window.innerWidth;
    let ch = window.innerHeight;
    c.width = cw; c.height = ch;
    const gl = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
    const prg = create_program(create_shader("vs"), create_shader("fs"));

    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let source = audioContext.createBufferSource();
    let sampleNum = audioContext.sampleRate;
    (function () {
        const vTransformFeedback = gl.createBuffer();
        const transformFeedback = gl.createTransformFeedback();
        gl.bindBuffer(gl.ARRAY_BUFFER, vTransformFeedback);
        gl.bufferData(gl.ARRAY_BUFFER, sampleNum * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_COPY);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, vTransformFeedback);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, sampleNum);
        gl.endTransformFeedback();
        let arrBuffer = new Float32Array(sampleNum);
        gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, arrBuffer);

        let audioBuffer = audioContext.createBuffer(2, sampleNum, sampleNum);
        for (let i = 0; i < 2; i++) {
            let bufferring = audioBuffer.getChannelData(i);
            bufferring.set(arrBuffer);
        }
        let source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.loop = true;
        source.start();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);        
    })();

    function create_shader(id) {
        let shader;
        const scriptElement = document.getElementById(id);
        if (!scriptElement) { return; }
        switch (scriptElement.type) {
            case "vertexShader.glsl":
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case "fragmentShader.glsl":
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        }
        gl.shaderSource(shader, scriptElement.text);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            alert(gl.getShaderInfoLog(shader));
            console.log(gl.getShaderInfoLog(shader));
        }
    }
    function create_program(vs, fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.transformFeedbackVaryings(program, ["sound"], gl.SEPARATE_ATTRIBS);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            return program;
        } else {
            return null;
        }
    }
});