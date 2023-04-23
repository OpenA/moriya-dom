
const wrk = {

	scale: 1,
	mode: 'pic',
	scv: document.createTextNode('100'),

	has_crop    : false,
	has_image   : false,
	has_figures : false,

	get img () {
		const img = new Image; img.className = 'image-wrk';
		img.addEventListener('load', this);
		Object.defineProperty(this, 'img', { value: img });
		this.has_image = true;
		return img;
	},
	get crop () {
		const crop = new PasL({ lock: 2, edgies: true });
		Object.defineProperty(this, 'crop', { value: crop });
		this.has_crop = true;
		return crop;
	},
	get figures () {
		const towl = new TowL({ lock: 2, edgies: true });
		Object.defineProperty(this, 'figures', { value: towl });
		this.has_figures = true;
		return towl;
	},
	get macro () {
		const macro = _setup('div', { class: 'macro-cont', style: getSettingsStyle() });
		for(const id of ['top', 'center', 'bottom']) {
			macro.appendChild(
				_setup('div', { id: `mxt_${id}`, class: 'macro-text', contentEditable: true })
			);
		}
		Object.defineProperty(this, 'macro', { value: macro });
		return macro;
	},

	draw_demo() {
		const iw = this.img.naturalWidth, maxS = 750,
		      ih = this.img.naturalHeight, isVert = iw < ih;
		let maxW = 0, txtY = 0, x = 40, w = iw,
		    maxH = 0, txtH = 0, y = 40, h = ih;

		if (isVert) {
			if (maxS < ih) h = maxS, w *= maxS / ih;
			maxW = w + 160, x = 80;
		} else {
			if (maxS < iw) w = maxS, h *= maxS / iw;
			maxW = w + 80;
		}
		maxH = txtY = h + 80;

		let ctx = drawLayers(canvas, maxW, maxH, [
			{ x: 0, y: 0, w: maxW, h: maxH, fill: '#000' },
		]);
		const txtBot = this.macro.children.mxt_bottom.innerText;
		const txtTop = this.macro.children.mxt_top.innerText;
		const txtP   = {
			hAlign  : 'center', maxW, maxH,
			fStyle  : inputs.font_style.checked ? inputs.font_style.value : '',
			fWeight : inputs.font_weight.checked ? inputs.font_weight.value : ''
		};
		txtP.fSize = 54, txtP.posY = txtH, txtH += drawText(ctx, txtTop, txtP).height + 10,
		txtP.fSize = 27, txtP.posY = txtH, txtH += drawText(ctx, txtBot, txtP).height + 30;
		const data = ctx.getImageData(0, 0, maxW, txtH);

		maxH += maxH < txtH ? maxH : txtH;
		ctx = drawLayers(canvas, maxW, maxH, [
			{ x: 0, y: 0, w: maxW, h: maxH, fill: '#000' },
			{ x: x - 5, y: y - 5, w: w + 10, h: h + 10, r: 4, fill: '#fff' },
			{ x, y, w, h, r: [0, 0, iw, ih], fill: this.img }
		]);
		ctx.lineWidth = 3;
		ctx.strokeStyle = '#000';
		ctx.rect(x, y, w, h);
		ctx.stroke();
		ctx.putImageData(data, 0, txtY);
	},

	draw_macro() {
		const { ctx, maxW, maxH } = this.draw_pic();

		const txtBottom  = this.macro.children.mxt_bottom.innerText;
		const txtTop     = this.macro.children.mxt_top.innerText;
		const lineHeight = this.macro.children.mxt_center.offsetHeight;
		const params = { maxW, maxH, lineHeight,
			hAlign  : inputs.text_align.value,
			fSize   : inputs.font_size.value / this.scale,
			fFamily : inputs.font_family.value || 'serif',
			sColor  : inputs.stroke_color.value,
			sWidth  : inputs.stroke_width.value,
			fColor  : inputs.fill_color.value
		};
		if (inputs.font_style.checked)
			params.fStyle = inputs.font_style.value;
		if (inputs.font_weight.checked)
			params.fWeight = inputs.font_weight.value;

		params.vAlign = 'top', drawText(ctx, txtTop, params);
		params.vAlign = 'bottom', drawText(ctx, txtBottom, params);
	},

	draw_pic() {
		const iw = (canvas.width  = this.img.naturalWidth),
		      ih = (canvas.height = this.img.naturalHeight),
		     ctx = (canvas.getContext('2d'));

		ctx.clearRect(0, 0, iw, ih);
		ctx.drawImage(this.img, 0, 0, iw, ih, 0, 0, iw, ih);

		return { ctx, maxW: iw, maxH: ih };
	},

	setImgSrc(src = '') {
		let old = this.img.src; this.scv.textContent = '100';
		this.img.style.width = this.img.style.height = '100%';
		this.img.src = src; this.scale = 1;
		return old;
	},

	reScaleImage(f = 1, reset = false) {

		this.scv.textContent = ((this.scale = f) * 100).toFixed(0);

		if (this.has_image) {

			let { width, height } = this.img;

			if (!reset) {
				this.img.style.width  = `${width  = this.img.naturalWidth  * f}px`;
				this.img.style.height = `${height = this.img.naturalHeight * f}px`;
			}
			if (this.has_crop)
				this.crop[`${reset ? 'set' : 'upd'}Zone`]({ width, height });
		}
	},

	handleEvent({ target: el }) {

		let clss  = el.classList[0],
		    reset = false,
		    scale = this.scale;

		switch (clss) {
		case 'image-wrk': reset = true;
		case 'scale-val': scale = 1;
			break;
		case 'scale-up':
			var f = scale + (scale >= 1.5 ? .1 : .05);
			scale = f >= 5 ? 5.0 : f;
			break;
		case 'scale-down':
			var f = scale - (scale > 1.5 ? .1 : .05);
			scale = f <= .05 ? .05 : f;
			break;
		}
		this.reScaleImage(scale, reset);
		window.postMessage({ msg: `${clss.substring(0,5)}-change`, val: scale }, '*');
	}
};

const s_pannel = document.getElementById('settings_panel'),
      fi_group = s_pannel.querySelector('.fnt-inp-group');

/* inputs collection like form.elements */
const inputs = {
	font_style   : fi_group.children.font_style_italic,
	font_weight  : fi_group.children.font_weight_bold,
	fill_color   : document.getElementById('fill_color'),
	stroke_color : document.getElementById('stroke_color'),
	stroke_width : new SanaeRuler({
		id: 'stroke_width',
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
		for_id: 'font_family', type: 2, place_text: 'Default',
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
inputs.stroke_color.after(inputs.stroke_width);
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
	if (data && data.msg === 'image-change')
		out_btn.className = 'out-apply';
});

const getSettingsStyle = () => {
	const keys = Object.keys(inputs), style = [];
	for(let key of keys) {
		let { value, checked } = inputs[key];
		if (checked === false)
			continue;
		key = String.prototype.replace.apply(key,
			key.startsWith('stroke') ? [/^stroke_(\w+)$/, '-webkit-text-stroke-$1'] : 
			key.startsWith('fill') ? ['fill_', ''] : ['_', '-']
		);
		style.push(`${key}: ${value}${Number.isFinite(value) ? 'px' : ''};`);
	}
	return style.join(' ');
}

const setParamStyle = (style, key, param, val) => {
	if (key !== 'fill') {
		param = `${key === 'stroke' ? '-webkit-text-stroke' : key}-${param}`;
	}
	style[param] = Number.isFinite(val) ? `${val}px` : val;
}

const getInputValues = () => {
	const values = Object.create(null);
	for (const key in inputs)
		values[key] = inputs[key].value;
	return values;
}

function onClickHandler({ target: el }) {

	let val = '';

	switch(el.classList[0]) {
	case 'clear-img':
		wrk_area.classList.remove('active');
		val = wrk.setImgSrc();
		break;
	case 'out-apply':
		wrk[`draw_${wrk.mode}`]();
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

function onChangeHandler({ target: { id, value, files, checked = true } }) {
	let [ key, param, val = value ] = id.split('_');

	const img_layer = document.getElementById('img_layer');

	switch(key) {
	case 'file':
		img_layer.append(wrk.img);
		val = wrk.setImgSrc( URL.createObjectURL(files[0]) );
		wrk_area.classList.add('active');
		break;
	case 'crop':
		if (checked) {
			let img = null, box = wrk.crop.box;
			if (wrk.has_image)
				wrk.crop.setZone((img = wrk.img));
			img_layer.insertBefore(box, img);
			wrk.has_crop = true;
		} else if (wrk.has_crop) {
			img_layer.removeChild(wrk.crop.box);
			wrk.has_crop = false;
		}
		break;
	case 'mode':
		img_area.className = `img-area mode-${wrk.mode = param}`;
		img_layer.after(wrk.macro);
		break;
	default:
		setParamStyle(wrk.macro.style, key, param, checked ? val : null);
	}
}

let target = document.querySelector('input[name="draw_mode"]:checked');
             document.getElementById('crop_tool').checked = false;
if (target) onChangeHandler({ target });
