
/**
 * Render multiline text block using the current state of the canvas.
 *
 * forked from https://github.com/geongeorge/Canvas-Txt/blob/master/src/canvas-txt/index.ts
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} text
 */
const drawText = (ctx, text = '', {
	posX = 0, posY = 0,
	maxW = 0, maxH = 0,

	hAlign = 'left' , vAlign = 'top',
	fColor = 'white', fSize  = 14,
	sColor = 'black', sWidth = 0,

	fStyle   = 'normal',
	fVariant = 'normal',
	fWeight  = 'normal',
	fFamily  = 'sans-serif',

	lineHeight = 0
}) => {
	//text or font size cannot be 0
	if (fSize <= 0 || !text)
		return { height: 0 };
	//--->
	ctx.font = `${fStyle} ${fVariant} ${fWeight} ${fSize}px '${fFamily}'`;
	ctx.fillStyle = fColor; ctx.textAlign = hAlign;
	ctx.lineWidth = sWidth; ctx.strokeStyle = sColor;

	if (maxW <= 0) maxW = ctx.canvas.width;
	if (maxH <= 0) maxH = ctx.canvas.height;
	if (lineHeight <= 0) {
		ctx.textBaseline = 'bottom';
		//close approximation of height with width
		lineHeight = Math.round(ctx.measureText(text).actualBoundingBoxAscent);
	}
	ctx.textBaseline = 'baseline';

	//added one-line only auto linebreak feature
	const textParts = [], lines = text.split('\n');

	for (let i = 0, f = 0; i < lines.length;) {

		let part = lines[i].substr(f), len = part.length, p = 0;

		while (ctx.measureText(part).width > maxW) {
			part = part.substr(0, --len), p = f + len;
		}
		//a new line only happens at a space, and not amidst a word
		if (p > 0) {
			let spi = part.lastIndexOf(' ') + 1;
			if (spi && spi !== len)
				part = part.substr(0, spi), p = f + spi;
		}
		// finally go to next line of next part of current line
		textParts.push(part), i += (f = p) === 0;
	}
	let len = textParts.length, vHeight = lineHeight * len;

	if (!textParts[len - 1])
		len--, vHeight -= lineHeight;

	// Horisontal Align
	posX += ( hAlign === 'right' ? maxW :
	          hAlign === 'center'? maxW / 2 : 0 ); //default = left
	// Vertical Align
	posY += ( vAlign === 'bottom' ?  maxH + fSize - vHeight : //default = top
	          vAlign === 'middle' ? (maxH / 2 + fSize / 2) - vHeight / 2 : fSize );

	//print all parts of text
	for (let i = 0, x = posX, y = posY; i < len; i++, y += lineHeight) {
		const line = textParts[i].trim();
		if ( !line ) continue;
		/* fColor */ ctx.fillText(line, x, y);
		if (sWidth) ctx.strokeText(line, x, y);
	}
	return { height: vHeight };
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last param, it will draw a normal rectangle
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} w The width of the rectangle
 * @param {Number} h The height of the rectangle
 * @param {Number} radii The radius value for all corners;
 * It can also be an array to specify different radii for corners:
 * 
 ** 1: [`TopLeft` & `BottomRight` & `TopRight` & `BottomLeft`]
 ** 2: [`TopLeft` & `BottomRight`,  `TopRight` & `BottomLeft`]
 ** 3: [`TopLeft`,  `TopRight` & `BottomLeft`, `BottomRight` ]
 ** 4: [`TopLeft`,  `TopRight`,  `BottomLeft`, `BottomRight` ]
 */
 const drawRoundedRect = (ctx, x, y, w, h, radii = 0) => {

	if (!radii)
		return ctx.rect(x, y, w, h);
	if (Number.isInteger(radii))
		radii = [radii];

	let [tl = 0, tr = 0, br = 0, bl = 0] = radii;

	if (radii.length === 1)
		bl = tr = br = tl;
	else if (radii.length === 2)
		bl = tr,  br = tl;
	else if (radii.length === 3)
		bl = tr;

	ctx.beginPath();
	ctx.moveTo(x + tl, y);
	ctx.lineTo(x + w - tr, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
	ctx.lineTo(x + w, y + h - br);
	ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
	ctx.lineTo(x + bl, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
	ctx.lineTo(x, y + tl);
	ctx.quadraticCurveTo(x, y, x + tl, y);
	ctx.closePath();
}

/**
 * This function makes CanvasContext2D with a complex background
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Number} maxW The maximum width
 * @param {Number} maxH The maximum height
 * @param {Array} layers List of objects that will be drawn on top of each other
 * 
 ** `x` - Offset along the x-axis from the left
 ** `y` - Offset along the y-axis from the top
 ** `w` - rect width
 ** `h` - rect height
 ** `fill` - Color string or Image element
 ** `r` - border radius value or [...values] for rect, or [x,y,w,h] coords for part of image
 */
const drawLayers = (canvas, maxW = 0, maxH = 0, layers = []) => {
	const { width, height } = canvas;

	canvas.width  = maxW || (maxW = width);
	canvas.height = maxH || (maxH = height);

	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, maxW, maxH);

	for (const { x, y, w, h, fill, r } of layers) {
		if (fill instanceof Image) {
			let [ix = 0, iy = 0, iw = 0, ih = 0] = r;
			ctx.drawImage(fill, ix, iy,
				iw <= 0 ? fill.naturalWidth : iw,
				ih <= 0 ? fill.naturalHeight : ih,
			x, y, w, h);
		} else {
			ctx.fillStyle = fill;
			drawRoundedRect(ctx, x, y, w, h, r);
			ctx.fill();
		}
	}
	return ctx;
}
