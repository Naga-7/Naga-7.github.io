const conditions = {
    currentOption: "start",

    start: {
        h: 0,
        s: 0,
        l: 0,
    },

    end: {
        h: 0,
        s: 0,
        l: 0,
    },

    pen: false,
}

const canvases = {
    main: document.getElementById("canvas"), 
    mask: document.getElementById("canvasMask"),
    base: document.getElementById("canvasBase"),
}

const maskSettings = {
    color: "#000",
    method: "paint",
    action: "draw",
    lineWidth: 50,
}

const hslImageData = {
    base: [],
    current: []
}

function RGBtoHSL(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;

    const hue = chroma === 0 ? 0 :
    max === r ? 60 * ((g - b) / chroma % 6) :
    max === g ? 60 * ((b - r) / chroma + 2) :
    60 * ((r - g) / chroma + 4);

    const lightness = (max + min) / 2;

    const saturation = lightness === 0 || lightness === 1 ? 0 :
    chroma / (1 - Math.abs(2 * lightness - 1));

    const hsl = [hue < 0 ? Math.round(hue + 360) : Math.round(hue), Math.round(saturation * 100), Math.round(lightness * 100)];
    return hsl;
}

function HSLtoRGB(hsl) {
    const h = hsl[0] / 60;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;

    const chroma = (1 - Math.abs(2 * l - 1)) * s;

    const x = chroma * (1 - Math.abs(h % 2 - 1));

    const rgbPrime = h >= 0 && h < 1 ? [chroma, x, 0] :
    h >= 1 && h < 2 ? [x, chroma, 0] :
    h >= 2 && h < 3 ? [0, chroma, x] :
    h >= 3 && h < 4 ? [0, x, chroma] :
    h >= 4 && h < 5 ? [x, 0, chroma] : [chroma, 0, x];

    const m = l - chroma / 2;

    const rgb = [Math.round(255 * (rgbPrime[0] + m)), Math.round(255 * (rgbPrime[1] + m)), Math.round(255 * (rgbPrime[2] + m))];
    return rgb;
}    

function clamp(min, value, max) {
    return Math.max(min, Math.min(value, max));
}

// Theme Button
{
    const html = document.querySelector("html");
    html.dataset.theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    let timer = null;
    
    document.querySelector("#themeButton").addEventListener("click", () => {
        html.dataset.transition = "on";
        html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";

        clearTimeout(timer);

        timer = setTimeout(() => {
            html.dataset.transition = "off";
        }, 1000)
    });
}

// Settings Buttons
{
    const settings = document.getElementById("settings");
    const settingsDropdown = document.getElementById("settingsDropdown");

    settings.addEventListener("click", () => {
        settingsDropdown.dataset.display = settingsDropdown.dataset.display === "none" ? "flex" : "none";
    });

    const context = canvases.main.getContext("2d");
    const baseContext = canvases.base.getContext("2d");
    
    const base = document.getElementById("base");
    base.addEventListener("click", () => {
        canvases.base.dataset.display = canvases.base.dataset.display === "none" ? "block" : "none";
        base.dataset.selected = base.dataset.selected === "false" ? "true" : "false";
    });

    const save = document.getElementById("save");
    save.addEventListener("click", () => {
        settingsDropdown.dataset.display =  "none";
        const canvasImage = context.getImageData(0, 0, canvases.main.width, canvases.main.height);
        baseContext.putImageData(canvasImage, 0, 0);

        for (let i = 0; i < canvasImage.data.length; i = i + 4) {
            const rgb = [canvasImage.data[i], canvasImage.data[i + 1], canvasImage.data[i + 2]];
            const hsl = RGBtoHSL(rgb);

            hsl[3] = canvasImage.data[i + 3];

            for (let j = 0; j < 4; j++) {
                hslImageData.base[i + j] = hsl[j];
            }
        }
    });

    const reset = document.getElementById("reset");
    reset.addEventListener("click", () => {
        settingsDropdown.dataset.display =  "none";
        const baseImage = baseContext.getImageData(0, 0, canvases.main.width, canvases.main.height);
        context.putImageData(baseImage, 0, 0);

        for (let i = 0; i < hslImageData.base.length; i++) {
            hslImageData.current[i] = hslImageData.base[i];
        }
    });

    const download = document.getElementById("download");
    download.addEventListener("click", () => {
        settingsDropdown.dataset.display =  "none";

        const imgObj = context.getImageData(20, 20, canvases.main.width - 40, canvases.main.height - 40);

        const tmpCanvas = document.createElement("canvas");
        [tmpCanvas.width, tmpCanvas.height] = [imgObj.width, imgObj.height];

        const tmpContext = tmpCanvas.getContext("2d");
        tmpContext.putImageData(imgObj, 0, 0);

        tmpCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);   
    
            const link = document.createElement("a");    
            link.download = "canvas.png";
            link.href = url;
            link.click();
    
            URL.revokeObjectURL(url);
            link.remove();
            tmpCanvas.remove();
        });
    });
}

// Canvas Wrapper
{
    const canvasWrapper = document.getElementById("canvasWrapper");
    const button = canvasWrapper.querySelector("button");
    const input = canvasWrapper.querySelector("input");

    button.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", () => {
        button.dataset.display = "none";

        const file = input.files[0];
        const img = new Image();
        const reader = new FileReader();
    
        reader.onload = (e) => {
            img.src = e.target.result;
        };
    
        reader.readAsDataURL(file);

        img.onload = () => {
            const margin = 20;

            Object.entries(canvases).forEach(([key, element]) => {
                const context = element.getContext("2d");

                [element.width, element.height] = [img.width + margin * 2, img.height + margin * 2];

                if (key !== "mask") {
                    context.drawImage(img, margin, margin);     
                }

                else {
                    context.putImageData(new ImageData(element.width, element.height), element.width, element.height);
                }

                if (key === "main") {
                    element.dataset.display = "block";
                    const imageData = context.getImageData(0, 0, element.width, element.height);

                    for (let i = 0; i < imageData.data.length; i = i + 4) {
                        const rgb = [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
                        const hsl = RGBtoHSL(rgb);

                        hsl[3] = imageData.data[i + 3];
            
                        hsl.forEach((value) => {
                            hslImageData.base.push(value);
                            hslImageData.current.push(value);
                        });
                    }
                }
            });

            canvasWrapper.style.alignItems = canvasWrapper.scrollTopMax === 0 ? "center" : "unset";
            canvasWrapper.style.justifyContent = canvasWrapper.scrollLeftMax === 0 ? "center" : "unset";
        }
    });

    window.addEventListener("resize", () => {        
        canvasWrapper.style.alignItems = canvasWrapper.scrollTopMax === 0 ? "center" : "unset";
        canvasWrapper.style.justifyContent = canvasWrapper.scrollLeftMax === 0 ? "center" : "unset";
    });
}

// Canvas Mask
{
    const context = canvases.mask.getContext("2d");
    const cursor = document.getElementById("canvasMaskCursor");

    let pointerDown;

    canvases.mask.addEventListener("pointerdown", (e) => {
        if (maskSettings.method === "paint") {
            context.filter = "invert(0%)";
            context.lineWidth = maskSettings.lineWidth;
            context.strokeStyle = maskSettings.color;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.globalCompositeOperation = maskSettings.action === "draw" ? "source-over" : "destination-out"
            context.beginPath();                
            context.lineTo(e.clientX - e.target.getBoundingClientRect().x, e.clientY - e.target.getBoundingClientRect().y);
            context.stroke();
            pointerDown = true;
        }
    });

    canvases.mask.addEventListener("pointermove", (e) => {
        if (maskSettings.method === "paint") {       
            cursor.style.cursor = "none"; 
            cursor.dataset.display = "block";
            cursor.style.width = `${maskSettings.lineWidth}px`;
            cursor.style.height = `${maskSettings.lineWidth}px`;
            cursor.style.left = `${e.clientX - maskSettings.lineWidth / 2 + .6}px`;
            cursor.style.top = `${e.clientY - maskSettings.lineWidth / 2 + .6}px`;      
        }

        else {
            cursor.style.cursor = "auto"; 
            cursor.dataset.display = "none";
        }

        if (!pointerDown) return;

        if (maskSettings.method === "paint") {            
            context.lineTo(e.clientX - e.target.getBoundingClientRect().x, e.clientY - e.target.getBoundingClientRect().y);
            context.stroke();
            baseImage = context.getImageData(0, 0, canvases.mask.width, canvases.mask.height);
        }     
    });

    canvases.mask.addEventListener("pointerout", () => {
        pointerDown = false;
        cursor.dataset.display = "none";
    });

    canvases.mask.addEventListener("pointerup", () => {
        pointerDown = false;
    });

    // Draw by polygon
    const polygon = [];

    const startingPoint = {
        x: 0,
        y: 0
    }

    let baseImage;
    let temporaryImage; 

    canvases.mask.addEventListener("click", (e) => {
        // Save the image before drawing a polygon.
        if (maskSettings.method !== "polygon") return;

        if (polygon.length === 0) {
            baseImage = context.getImageData(0, 0, canvases.mask.width, canvases.mask.height);
        }
        
        // Each click saves one stroke.
        temporaryImage = context.getImageData(0, 0, canvases.mask.width, canvases.mask.height);
        
        context.filter = maskSettings.action === "draw" ? "" : "invert(100%)";
        context.globalCompositeOperation = "source-over";
        context.lineWidth = 1;
        context.strokeStyle = maskSettings.color;
        context.fillStyle = maskSettings.color;
        context.lineCap = "round";
        context.lineJoin = "round";

        polygon.push([e.clientX - e.target.getBoundingClientRect().x, e.clientY - e.target.getBoundingClientRect().y]);
        [startingPoint.x, startingPoint.y] = [e.clientX - e.target.getBoundingClientRect().x, e.clientY - e.target.getBoundingClientRect().y];
    });

    canvases.mask.addEventListener("pointermove", (e) => {
        if (polygon.length !== 0) {
            // Every time the pointer moves, erase the old stroke and create a new one.
            // Because the stroke is not saved, only the image before it.
            context.putImageData(temporaryImage, 0, 0);

            // Temporary stroke to show the polygon being drawn.

            context.beginPath();
            context.moveTo(startingPoint.x, startingPoint.y);
            context.lineTo(e.clientX - e.target.getBoundingClientRect().x, e.clientY - e.target.getBoundingClientRect().y);
            context.stroke();
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "a" || e.key === "A") {
            // Erase the temporary strokes.
            context.putImageData(baseImage, 0, 0);
            
            context.globalCompositeOperation =  maskSettings.action === "erase" ? "destination-out" : "source-over";

            context.beginPath();

            polygon.forEach((point, index) => {
                if (index === 0) {
                    context.moveTo(point[0], point[1]);
                }

                else {
                    context.lineTo(point[0], point[1]);
                }
            });

            context.fill();

            polygon.length = 0;
            
            context.globalCompositeOperation = "source-over";
            baseImage = context.getImageData(0, 0, canvases.mask.width, canvases.mask.height);
        }

        else if (e.key === "Escape") {
            context.closePath();
            context.putImageData(baseImage, 0, 0);
            polygon.length = 0;
        }
    });

    document.getElementById("paint").addEventListener("click", () => {
        if (polygon.length !== 0) {
            context.closePath();
            context.putImageData(baseImage, 0, 0);
            polygon.length = 0;
        }
    });
}

// Mask (tab logic)
{
    function buttonsDisabled(boolean) {
        const buttons = document.querySelectorAll("button");
        buttons.forEach((button) => {
            button.disabled = boolean;
        });
    }

    const mask = document.getElementById("mask");
    const tab = document.getElementById(mask.dataset.tab);
    const tabButtons = tab.querySelectorAll("button");

    mask.addEventListener("click", () => {
        tab.dataset.display = "flex";

        buttonsDisabled(true);

        tabButtons.forEach((button) => {
            button.disabled = false;
        });

        if (hslImageData.base.length !== 0) {
            canvases.mask.dataset.display = "block";
        }
    });

    const closeTabButton = tab.querySelector(".closeButton");

    closeTabButton.addEventListener("click", () => {
        tab.dataset.display = "none";
        canvases.mask.dataset.display = "none";
        buttonsDisabled(false);
    });
}

// Mask
{
    // Mask Color
    const maskColor = document.getElementById("maskColor");
    const colorCircle = maskColor.querySelector(".colorCircle");
    const colorInput = maskColor.querySelector("input");

    maskColor.addEventListener("click", () => {
        colorInput.click();
    });

    colorInput.addEventListener("input", () => {
        colorCircle.style.backgroundColor = colorInput.value;
        maskSettings.color = colorInput.value;
    });

    // Mask Method
    const paint = document.getElementById("paint");
    const polygon = document.getElementById("polygon");

    paint.addEventListener("click", () => {
        maskSettings.method = "paint";
        paint.dataset.selected = "true";
        polygon.dataset.selected = "false"
    });

    polygon.addEventListener("click", () => {
        maskSettings.method = "polygon";
        paint.dataset.selected = "false";
        polygon.dataset.selected = "true";
    });

    // Mask Action
    const draw = document.getElementById("draw");
    const erase = document.getElementById("erase");

    draw.addEventListener("click", () => {
        maskSettings.action = "draw";
        draw.dataset.selected = "true";
        erase.dataset.selected = "false"
    });

    erase.addEventListener("click", () => {
        maskSettings.action = "erase";
        draw.dataset.selected = "false";
        erase.dataset.selected = "true";
    });

    // Mask input number
    const maskLineWidth = document.getElementById("maskLineWidth");
    const maskOpacity = document.getElementById("maskOpacity");
    const canvasOpacity = document.getElementById("canvasOpacity");

    maskLineWidth.addEventListener("slider", () => {
        maskSettings.lineWidth = Number(maskLineWidth.value);
    });

    maskOpacity.addEventListener("slider", (e) => {
        canvases.mask.style.opacity = e.target.value / 100;
    });

    canvasOpacity.addEventListener("slider", (e) => {
        canvases.main.style.opacity = e.target.value / 100;
    });
}

// Conditions Buttons
{
    const optionIdList = ["start", "end"];

    optionIdList.forEach((id) => {
        const option = document.getElementById(id);
        const group = document.querySelectorAll("[data-group='1']");

        option.addEventListener("click", () => {
            conditions.currentOption = id;

            group.forEach((element) => {
                if (element === option) {
                    element.dataset.selected = "true";
                }

                else {
                    element.dataset.selected = "false";
                }
            });

            updateHslSlider();
        });
    });
}

// Pen
{
    const pen = document.getElementById("pen");
    pen.addEventListener("click", () => {
        conditions.pen = !conditions.pen;
        pen.dataset.selected = conditions.pen ? "true" : "false";
    });

    const canvasIdList = ["canvas", "canvasBase"];

    canvasIdList.forEach((id) => {
        const canvas = document.getElementById(id);
        const context = canvas.getContext("2d");

        canvas.addEventListener("click", (e) => {
            if (conditions.pen) {
                conditions.pen = false;
                pen.dataset.selected = "false";
    
                conditions.pen = false;
                pen.dataset.selected = "false";
    
                const rgb = context.getImageData(e.layerX, e.layerY, 1, 1).data.slice(0, 3);
                const hsl = RGBtoHSL(rgb);
    
                conditions[conditions.currentOption] = {
                    h: hsl[0],
                    s: hsl[1],
                    l: hsl[2]
                }
    
                updateHslSlider();
            }
        });
    });
}

// Slider Wrapper Listener
const sliderEvent = new Event("slider");
{
    let currentWrapper = null;

    const sliderWrapperList = document.querySelectorAll(".sliderWrapper");

    sliderWrapperList.forEach((wrapper) => {
        if (wrapper.dataset.initial) {
            initSlider(wrapper);
        }
        
        wrapper.addEventListener("pointerdown", (e) => {
            currentWrapper = wrapper;          
            updateSlider(e, wrapper);
        });

        const input = wrapper.querySelector(".sliderInput");
        input.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
        });
        
        input.addEventListener("change", (e) => {
            updateSlider(e, wrapper, input.value);
        });

        const buttonAndSpanList = wrapper.querySelectorAll("button, span");
        buttonAndSpanList.forEach((element) => {
            element.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
            });
        });
    });

    window.addEventListener("pointermove", (e) => {
        if (currentWrapper) {
            updateSlider(e, currentWrapper);
        }  
    });

    window.addEventListener("pointerup", () => {
        currentWrapper = null;
    });
}

function initSlider(wrapper) {
    const thumb = wrapper.querySelector(".thumb");
    const initial = Number(wrapper.dataset.initial);
    const max = Number(wrapper.dataset.max);
    const min = Number(wrapper.dataset.min);

    const percentage = min >= 0 ? initial / max :
    (initial + Math.abs(min)) / (max + Math.abs(min));

    thumb.style.left = percentage * 100 + "%";
}

function updateSlider(e, wrapper, value) {
    const slider = wrapper.querySelector(".slider");
    const thumb = wrapper.querySelector(".thumb");
    const input = wrapper.querySelector(".sliderInput");
    const max = Number(wrapper.dataset.max);
    const min = Number(wrapper.dataset.min);

    let percentage;

    if (value !== undefined) {
        value = Number(value);

        if (isNaN(value)) {
            percentage = 0;
        }

        else if (min >= 0) {
            percentage = value < 0 ? 0 :
            value > max ? 1 : value / max;
        }

        else {       
            percentage = value < min ? 0 :
            value > max ? 1 :
            (value + Math.abs(min)) / (max + Math.abs(min));
           
        }
    }

    else {
        percentage = e.pageX - slider.offsetLeft < 0 ? 0 :
        e.pageX > slider.offsetWidth + slider.offsetLeft ? 1 : (e.pageX - slider.offsetLeft) / slider.offsetWidth;
    }

    thumb.style.left = percentage * 100 + "%";
    input.value = min >= 0 ? Math.round(max * percentage) :
    Math.round(percentage * (max + Math.abs(min)) + min);

    input.dispatchEvent(sliderEvent);
}

// HSL slider
{
    const hslSliderList = document.querySelectorAll("[data-key]");

    hslSliderList.forEach((hslSlider) => {
        const input = hslSlider.querySelector("input");

        input.addEventListener("slider", () => {
            conditions[conditions.currentOption][hslSlider.dataset.key] = Number(input.value);
            updateHslSlider();
        });
    });
}

function updateHslSlider() {
    const keyList = ["h", "s", "l"];

    const h = conditions[conditions.currentOption].h;
    const s = conditions[conditions.currentOption].s;
    const l = conditions[conditions.currentOption].l;

    keyList.forEach((key) => {
        const wrapper = document.querySelector(`[data-key='${key}']`);
        const slider = wrapper.querySelector(".slider")
        const thumb = wrapper.querySelector(".thumb");
        const input = wrapper.querySelector(".sliderInput")

        if (key !== "h") {
            const gradient = key === "s" ? `linear-gradient(to right, hsl(${h}, 0%, 50%), hsl(${h}, 100%, 50%))` :
            `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`;

            slider.style.backgroundImage = gradient;
        }

        thumb.style.left = conditions[conditions.currentOption][key] / wrapper.dataset.max * 100 + "%";

        const color = key === "h" ? `hsl(${h}, 100%, 50%)` :
        key === "s" ? `hsl(${h}, ${s}%, 50%)` : `hsl(${h}, ${s}%, ${l}%)`

        thumb.style.backgroundColor = color;
        input.value = conditions[conditions.currentOption][key];
    });

    const circle = document.getElementById(conditions.currentOption).querySelector(".colorCircle");
    circle.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
}

const changeHSLobj = {
    rotate: false,

    multiply: true,

    multiplyValues: [100, 100],

    sumValues: [0, 0]
}

{
    const rotateButton = document.getElementById("rotate");
    const setHue = document.getElementById("setHue");
    const rotateHue = document.getElementById("rotateHue");  

    rotateButton.addEventListener("click", () => {
        changeHSLobj.rotate = !changeHSLobj.rotate;
        rotateButton.dataset.selected = changeHSLobj.rotate ? "true" : "false";
        setHue.dataset.display = changeHSLobj.rotate ? "none" : "flex";
        rotateHue.dataset.display = changeHSLobj.rotate ? "flex" : "none";
    });

    setHue.querySelector("input").addEventListener("slider", (e) => {
        setHue.querySelector(".thumb").style.backgroundColor = `hsl(${e.target.value}, 100%, 50%)`;
        changeHSL(0, e.target.value);
    });

    rotateHue.querySelector("input").addEventListener("slider", (e) => {
        changeHSL(0, e.target.value);
    });

    const multiplyS = document.getElementById("multiplyS");
    const multiplyL = document.getElementById("multiplyL");

    const sumS = document.getElementById("sumS");
    const sumL = document.getElementById("sumL");

    const multiplyButton = document.getElementById("multiply");

    multiplyButton.addEventListener("click", () => {
        multiplyButton.dataset.selected = "true";
        sumButton.dataset.selected = "false";
        multiplyS.dataset.display = "flex";
        multiplyL.dataset.display = "flex";
        sumS.dataset.display = "none";
        sumL.dataset.display = "none";
        changeHSLobj.multiply = true;
    });

    const sumButton = document.getElementById("sum");

    sumButton.addEventListener("click", () => {
        multiplyButton.dataset.selected = "false";
        sumButton.dataset.selected = "true";
        multiplyS.dataset.display = "none";
        multiplyL.dataset.display = "none";
        sumS.dataset.display = "flex";
        sumL.dataset.display = "flex";
        changeHSLobj.multiply = false;
    });

    multiplyS.querySelector("input").addEventListener("slider", (e) => {
        changeHSLobj.multiplyValues[0] = Number(e.target.value);
        changeHSL(1, 0);
    });

    multiplyL.querySelector("input").addEventListener("slider", (e) => {
        changeHSLobj.multiplyValues[1] = Number(e.target.value);
        changeHSL(2, 0);
    });

    sumS.querySelector("input").addEventListener("slider", (e) => {
        changeHSLobj.sumValues[0] = Number(e.target.value);
        changeHSL(1, 0);
    });

    sumL.querySelector("input").addEventListener("slider", (e) => {
        changeHSLobj.sumValues[1] = Number(e.target.value);
        changeHSL(2, 0);
    });
}

function changeHSL(option, value) {
    value = Number(value);

    const context = canvases.main.getContext("2d");
    const imageData = context.getImageData(0, 0, canvases.mask.width, canvases.mask.height);    
    const maskImage = canvases.mask.getContext("2d").getImageData(0, 0, canvases.mask.width, canvases.mask.height);
    
    for (let i = 0; i < hslImageData.base.length; i = i + 4) {        
        if (maskImage.data[i + 3] && hslImageData.base[i + 3]) {

            if (conditions.start.h <= conditions.end.h && !(hslImageData.base[i] >= conditions.start.h && hslImageData.base[i] <= conditions.end.h)) {
                continue
            }

            // true
            else if (conditions.start.h >= conditions.end.h && !(hslImageData.base[i] >= conditions.start.h || hslImageData.base[i] <= conditions.end.h)) {
                continue
            }

            if (hslImageData.base[i + 1] >= conditions.start.s && hslImageData.base[i + 1] <= conditions.end.s &&
                hslImageData.base[i + 2] >= conditions.start.l && hslImageData.base[i + 2] <= conditions.end.l) {
                if (option === 0) {
                    if (changeHSLobj.rotate) {
                        hslImageData.current[i] = (hslImageData.base[i] + value) % 360;
                    }
    
                    else {
                        hslImageData.current[i] = value;
                    }
                }

                else {
                    hslImageData.current[option + i] = clamp(0,
                        hslImageData.base[option + i] * (changeHSLobj.multiplyValues[option - 1] / 100) + changeHSLobj.sumValues[option - 1],
                    100);
                }

                const rgb = HSLtoRGB([hslImageData.current[i], hslImageData.current[i + 1], hslImageData.current[i + 2]]);

                for (let j = 0; j < 3; j++) {
                    imageData.data[i + j] = rgb[j];
                }
            }            
        }
    }

    context.putImageData(imageData, 0, 0);
}
