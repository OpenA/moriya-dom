
const wrk = {

	scale: 0, scv: document.createTextNode('100'),

	get img () {
		const img = new Image; img.className = 'work-img';
		const layer = document.getElementById('img_layer');
		layer.appendChild(img).addEventListener('load', this);
		Object.defineProperty(this, 'img', { value: img });
		return img;
	},
	get kana () {
		const kana = new KanakoInput;
		kana.kaNodeInput.classList.add('ko-moko');
		Object.defineProperty(this, 'kana', { value: kana.kaNodeInput });
		return kana;
	},
	get macro () {
		const value = _setup('div', { class: 'macro-cont' });
		for(const id of ['top', 'bottom']) {
			const el = _setup('code', { id: `${id}-text`, class: 'macro-text' }, {
				blur: () => { el.contentEditable = false; },
				dblclick: () => { el.contentEditable = true; }
			});
			value.append(el);
		}
		Object.defineProperty(this, 'macro', { value });
		return value;
	},

	setImgSrc(src = '') {
		let old = this.img.src; this.scv.textContent = '100';
		this.img.style.width = this.img.style.height = '100%';
		this.img.src = src; this.scale = 1;
		return old;
	},

	reScaleImage(f = 1) {
		this.scv.textContent = ((this.scale = f) * 100).toFixed(0);
		this.img.style.width = `${this.img.naturalWidth * f}px`,
		this.img.style.height = `${this.img.naturalHeight * f}px`;
	},

	handleEvent({ target: el }) {

		const { scale } = this;

		let val = 1, msg = 'scale-change';
		switch (el.classList[0]) {
		case 'work-img':
			msg = 'img-change';
			val = el.width / el.naturalWidth;
			break;
		case 'scale-up':
			val = scale + .05,
			val = val >= 5 ? scale : scale >= 1.5 ? val + .05 : val;
			break;
		case 'scale-down':
			val = scale - .05,
			val = val <= 0 ? .05 : scale > 1.5 ? val - .05 : val;
			break;
		}
		this.reScaleImage(val);
		window.postMessage({ msg, val }, '*');
	}
};

const s_pannel = document.getElementById('settings_panel'),
      fi_group = s_pannel.querySelector('.fnt-inp-group');

/* inputs collection like form.elements */
const inputs = {
	style_italic : fi_group.children.style_italic,
	style_bold   : fi_group.children.style_bold,
	fill_color   : document.getElementById('fill_color'),
	stroke_color : document.getElementById('stroke_color'),
	stroke_size  : new SanaeRuler({
		id: 'stroke_size',
		label: 'stroke',
		min: .5, max: 10,
		precision: 1,
		width: 155
	}),
	font_size: new SanaeRuler({
		id: 'font_size',
		label: 'font',
		min: 10, max: 180,
		precision: 0,
		width: 175
	}),
	font_family: new SuwakoOptions({
		for_id: 'font_family', type: 2,
		list: [
			{ class: 'fnt-fam', style: 'font-family: Arial', 'data-value': 'Arial' },
			{ class: 'fnt-fam', style: 'font-family: Impact', 'data-value': 'Impact' },
			{ class: 'fnt-fam', style: 'font-family: Tahoma', 'data-value': 'Tahoma' },
			{ class: 'fnt-fam', style: 'font-family: Verdana', 'data-value': 'Verdana' },
			{ text: 'funcy fonts' },
			{ class: 'fnt-fam', style: 'font-family: "Agora Slab Pro"', 'data-value': 'Agora Slab Pro' },
			{ class: 'fnt-fam', style: 'font-family: Akademitscheskaya', 'data-value': 'Akademitscheskaya' },
			{ class: 'fnt-fam', style: 'font-family: "Beau Sans Pro"', 'data-value': 'Beau Sans Pro' },
			{ class: 'fnt-fam', style: 'font-family: "Gotham Narrow"', 'data-value': 'Gotham Narrow' },
			{ class: 'fnt-fam', style: 'font-family: Gunplay', 'data-value': 'Gunplay' },
			{ class: 'fnt-fam', style: 'font-family: Ponter', 'data-value': 'Ponter' }
		]
	}),
	get text_align() {
		const {
			text_align_left: left, text_align_center: center,
			text_align_right: right
		} = fi_group.parentNode.children;
		return center.checked ? center : right.checked ? right : left
	}
};
/* add custom inputs */
inputs.fill_color.after(inputs.font_size);
inputs.stroke_color.after(inputs.stroke_size);
fi_group.append(inputs.font_family);

const canvas   = document.getElementById('canvas');
const wrk_area = document.body.querySelector('.work-area'),
      img_area = wrk_area.querySelector('.img-area'),
      out_btn  = canvas.nextElementSibling; 

/* add handlers */
img_area.children[2].children[1].append(wrk.scv); // scale-val
img_area.children[1].addEventListener('click', onClickHandler);
img_area.children[2].addEventListener('click', wrk);

s_pannel.addEventListener('change', onChangeHandler);
out_btn.addEventListener('click', onClickHandler);
window.addEventListener('message', ({ data }) => {
	if (data && data.msg === 'img-change')
		out_btn.className = 'out-apply';
});

const clearContext = () => {
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const drawImage = (img, x = 0, y = 0, w = 0, h = 0) => {
	canvas.width  = w || (w = img.width);
	canvas.height = h || (h = img.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
	return ctx;
}

const getInputValues = () => {
	const values = Object.create(null);
	for (const key in inputs)
		values[key] = inputs[key].value;
	return values;
}

function drawDemo(img, txt, x = 0, y = 0, w = 0, h = 0) {

	let dx = Math.floor(w / 8), dy = dx + h / 2;
	
	canvas.width = (w + dx * 2), canvas.height = h + dy;
	
	const ctx = canvas.getContext('2d');
	
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, x, y, w, h, dx, dx, w, h);
	
	const { stroke_size, stroke_color, font_italic, font_bold, font_size, font_family, font_color } = _APPLICATION_;
	contxt.font        = `${font_italic} ${font_bold} ${font_size}px "${font_family}"`;
	contxt.lineWidth   = stroke_size;
	contxt.strokeStyle = stroke_color;
	contxt.fillStyle   = font_color;
	contxt.textAlign   = 'center';
	
	const textUnder = document.getElementById('under-text').textContent;
	contxt.textBaseline = "bottom";
	contxt.fillText(textUnder, canvas.width/2, H + dy, canvas.width - dx);
	contxt.strokeText(textUnder, canvas.width/2, H + dy, canvas.width - dx);
}

function drawMacro() {
	let [X, Y, W, H] = pasL.getCoords();
	canvas.width = W, canvas.height = H;
	const contxt = canvas.getContext('2d');
	contxt.drawImage(image, X, Y, W, H, 0, 0, W, H);
	
	const { stroke_size, stroke_color, font_italic, font_bold, font_size, font_family, font_color } = _APPLICATION_;
	contxt.font        = `${font_italic} ${font_bold} ${font_size}px "${font_family}"`;
	contxt.lineWidth   = stroke_size;
	contxt.strokeStyle = stroke_color;
	contxt.fillStyle   = font_color;
	contxt.textAlign   = 'center';
	
	const textBottom = document.getElementById('bottom-text').textContent;
	const textTop    = document.getElementById('top-text').textContent;
	
	X = W / 2, Y = Math.floor(font_size / 10);
	
	contxt.textBaseline = 'top';
	contxt.fillText(textTop, X, Y, W);
	contxt.strokeText(textTop, X, Y, W);
	contxt.textBaseline = 'bottom';
	contxt.fillText(textBottom, X, H - stroke_size, W);
	contxt.strokeText(textBottom, X, H - stroke_size, W);
}

function onClickHandler({ target: el }) {

	let val = '';

	switch(el.classList[0]) {
	case 'clear-img':
		img_area.classList.remove('active');
		val = wrk.setImgSrc();
		break;
	case 'out-apply':
		clearContext();
		drawImage(wrk.img);
		el.className = 'out-save';
		break;
	case 'out-item':
		let type = el.innerText;
		el = out_btn, val = out_btn.lastElementChild.href;
		canvas.toBlob(blob => {
			out_btn.lastElementChild.href = URL.createObjectURL(blob);
			out_btn.lastElementChild.download = 'canvas.'+ (type === 'jpeg' ? 'jpg' : type);
			out_btn.lastElementChild.click();
		}, `image/${type}`);
	case 'out-save':
		el.classList.toggle('active');
		break;
	}
	if (/^blob\:/.test(val))
		URL.revokeObjectURL(val);
}

function onChangeHandler({ target }) {
	let [ key, func, val ] = target.id.split('_');

	switch(key) {
	case 'file':
		val = URL.createObjectURL(target.files[0]);
		img_area.classList.add('active');
		wrk.setImgSrc( val );
		break;
	case 'mode':
		wrk_area.className = `work-area mode-${func}`;
		if (func === 'kana') {} else { wrk.img.before(wrk.macro) }
	}
}

//var dElem = null;

//var btn = document.getElementById("draw-btn");
//var ctx = c.getContext("2d");
//var fSz = c.width / 10
//var offX = 0
//var offY = 0
//function Modulate(el) {
//    return [
//        (el.naturalWidth / el.clientWidth) * el.clientWidth,
//    	(el.naturalHeight / el.clientHeight) * el.clientHeight
//    ]
//};
//
//btn.onclick = function(e){
//    var pX = img.naturalWidth / img.width, pY = img.naturalHeight / img.height;
//    ctx.drawImage(img, offX*pX,offY*pY, 500*pX, 500*pY, 0, 0, 500,500);
//    ctx.fillText(tt.value,x,fSz);
//	ctx.strokeText(tt.value,x,fSz);
//    ctx.fillText(bt.value,x,y);
//	ctx.strokeText(bt.value,x,y);
//}
//// Fill with gradient
//ctx.font = 'normal bold '+fSz+'px verdana';
//ctx.textAlign = 'center';
//ctx.lineWidth = 3;
//ctx.strokeStyle = 'black';
//ctx.fillStyle = 'white';
//
//tt.oninput = bt.oninput = drawProgress;
//c.onclick = function(e){
//	if (e.offsetY > this.height / 2)
//        bt.focus()
//    else if (e.offsetY < this.height / 2)
//        tt.focus()
//}
//c.onmousedown = function(e){
//	var coords = getCoords(this);
//		dElem = {
//			el: this,
//			shiftX: e.pageX - coords.left,
//			shiftY: e.pageY - coords.top
//		}
//}
//c.onmouseup = function(e){
//	offY = Number(this.style.top.replace('px', ''))
//    offX = Number(this.style.left.replace('px', ''))
//}
//
//document.onmousemove = function(e) {
//	if (dElem) {
//		dElem.el.style.top  = e.clientY - dElem.shiftY + 'px';
//		dElem.el.style.left = e.clientX - dElem.shiftX + 'px';
//    	e.preventDefault()
//    }
//}
//document.onmouseup = function(e) {
//	dElem = null
//}
//	function getCoords(elem) {
//		var box = elem.getBoundingClientRect();
//		return {
//			top: box.top + pageYOffset,
//			left: box.left + pageXOffset
//		}
//	}
