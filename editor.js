
const wrk = {

	scale: 0, scv: document.createTextNode('100'), mode: '',

	get img () {
		const img = new Image; img.className = 'work-img';
		const layer = document.getElementById('img_layer');
		layer.appendChild(img).addEventListener('load', this);
		Object.defineProperty(this, 'img', { value: img });
		return img;
	},
	get crop () {
		const crop = new PasL({ lock: 2, edgies: true });
		Object.defineProperty(this, 'crop', { value: crop });
		return crop;
	},
	get towl () {
		const towl = new TowL({ lock: 2, edgies: true });
		Object.defineProperty(this, 'towl', { value: towl });
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
		const iw = this.img.naturalWidth,
		      ih = this.img.naturalHeight;
		let maxW = (canvas.width  = iw);
		let maxH = (canvas.height = ih);

		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, maxW, maxH);
		ctx.drawImage(this.img, 0, 0, iw, ih, 0, 0, maxW, maxH);

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

	setSettings(key, param, val, apply) {
		if (key !== 'fill')
			param = `${key === 'stroke' ? '-webkit-text-stroke' : key}-${param}`;
		if (Number.isFinite(val))
			val = `${val}px`;
		this.macro.style[param] = apply ? val : null;
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
	if (data && data.msg === 'img-change')
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
		img_area.classList.remove('active');
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
		val = URL.createObjectURL(files[0]);
		img_area.classList.add('active');
		wrk.setImgSrc( val );
		break;
	case 'tool':
		if (param === 'crop') {
			img_layer.append(wrk.crop.box);
		} else
			img_layer.append(wrk.towl.box);
		break;
	case 'mode':
		wrk_area.className = `work-area mode-${wrk.mode = param}`;
		img_layer.after(wrk.macro);
		break;
	default:
		wrk.setSettings(key, param, val, checked);
	}
}

let target = document.querySelector('input[name="draw_mode"]:checked');
if (target) onChangeHandler({ target });
