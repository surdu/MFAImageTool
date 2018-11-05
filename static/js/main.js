var input = document.getElementById('file');
var output = document.getElementById('output');

var workCanvas = document.getElementById("workCanvas");
var canvas = document.getElementById("preview");

var fitCheckbox = document.getElementById("fitCheckbox");
var centerCheckbox = document.getElementById("centerCheckbox");

var ctx = canvas.getContext("2d");
var wctx = workCanvas.getContext("2d");

var img;

function clear() {
	wctx.fillStyle = "white";
	wctx.fillRect(0, 0, workCanvas.width, workCanvas.height);

		ctx.fillStyle = "#8e0000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
	if (!img) {
		return;
	}

	clear();

	var ratio = 1;
	var imgXPos = 0;
	var imgYPos = 0;

	if (fitCheckbox.checked) {
		var hRatio = workCanvas.width / img.width;
		var vRatio = workCanvas.height / img.height;
		ratio  = Math.min(hRatio, vRatio);
	}

	if (centerCheckbox.checked) {
		imgXPos = ( workCanvas.width - img.width*ratio ) / 2;
		imgYPos = ( workCanvas.height - img.height*ratio ) / 2;
	}

	wctx.drawImage(img, 0,0, img.width, img.height, imgXPos, imgYPos, img.width * ratio, img.height * ratio);

	var imageData = wctx.getImageData(0, 0, workCanvas.width, workCanvas.height).data;

	ctx.fillStyle = "#d50000";

	var byte = "";
	var data = [];
	var firstNonZeroIndex;
	var lastNonZeroIndex = 0;

	for (var f = 0; f < imageData.length / 4; f++) {
		// calculate crude color indicator
		var color = imageData[f * 4] + imageData[(f * 4) + 1] + imageData[(f * 4) + 2];

		var x = f % workCanvas.width;
		var y = parseInt(f / workCanvas.width, 10);

		// if the color tends to white
		if (color <= ((255 / 2) * 3) ) {
			ctx.fillRect(x * 4, y * 4, 4, 4);
			byte += "1";
		}
		else {
			byte += "0";
		}

		// convert binary string to int
		if (byte.length === 8) {
			var value = parseInt(byte, 2);
			data.push(value);
			byte = "";

			if (value !== 0) {
				if (firstNonZeroIndex === undefined) {
					firstNonZeroIndex = data.length - 1;
				}

				lastNonZeroIndex = data.length - 1;
			}
		}
	}

	var nearestRowStart = 0;
	// trim front zeroes
	if (firstNonZeroIndex) {
		nearestRowStart = firstNonZeroIndex - firstNonZeroIndex % 8;
		data.splice(0, nearestRowStart);
	}

	// trim tailing zeroes
	if (lastNonZeroIndex !== data.length - 1) {
		lastNonZeroIndex -= nearestRowStart;
		var nextRowEnd = (lastNonZeroIndex - lastNonZeroIndex % 8) + 8;
		data.splice(nextRowEnd + 1);
	}

	var startY = nearestRowStart / 8;
	var height = Math.ceil(data.length / 8) - 1;

	output.value =
`void drawBootImage(MFA mfa) {
	uint8_t bootImage[${data.length}] = {${data.join(",")}};
	mfa.drawImage(0, ${startY}, 64, ${height}, bootImage);
}
`;
}

function handleFile(e) {
	img = new Image;
	img.onload = render;
	img.src = URL.createObjectURL(e.target.files[0]);
}

!!function init() {
	input.addEventListener("change", handleFile);
	fitCheckbox.addEventListener("change", render);
	centerCheckbox.addEventListener("change", render);
	clear();
}();
