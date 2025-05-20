/** Custom element like `<input type="range">` */
class SanaeRuler extends HTMLElement {

	constructor({ id = '',
		label = 'size', width = 150, min = 0,
		type  = 'px', precision = 0, max = 100,
	}) {
		const sae_ruler  = super(); if (id) sae_ruler.id = id;
		const sae_line   = this.createIn(sae_ruler, 'sae-line'  );
		const sae_slider = this.createIn(sae_ruler, 'sae-slider');
		const sae_value  = this.createIn(sae_line , 'sae-value' );

		let rls = [document.createElement('r-hl')],
		    len = Math.round(width / 22), _t = -1;

		for(let i = 0; i < len; i++)
			rls.push(document.createElement('r-l'));
		sae_line .setAttribute('data-label', label);
		sae_value.setAttribute('data-type' , type );

		sae_value.textContent = min;
		sae_value.spellcheck  = false;
		sae_value.contentEditable = true;

		sae_ruler.prepend(...rls);

		sae_slider.style.left = 0;
		sae_ruler.style.width = `${width}px`;
		sae_ruler.addEventListener(MUI_DOWN, this);
		sae_value.addEventListener('input', e => {
			if (_t != -1)
			   clearTimeout(_t);
			_t = setTimeout(() => this._onInput(e), 800);
		});

		let getIntVal = () => parseInt  (sae_value.textContent);
		let getFpVal  = () => parseFloat(sae_value.textContent);
		let setIntVal = i  => (sae_value.textContent = Math.floor(i));
		let setFpVal  = f  => (sae_value.textContent = f.toFixed(precision));

		Object.defineProperties(this, {
			min: { value: min, enumerable: true, writable: true },
			max: { value: max, enumerable: true, writable: true },
			value: {
				get: precision ? getFpVal : getIntVal, enumerable: true,
				set: precision ? setFpVal : setIntVal, configurable: true
			},
			precision: {
				get: () => precision, enumerable: true,
				set: n => {
					let setVal = (precision = n) ? setFpVal : setIntVal;
					Object.defineProperty(this, 'value', setVal);
				}
			},
			dataLabel: {
				get: () => label, enumerable: true,
				set: l => { sae_line.setAttribute('data-label', (label = l)) }
			},
			dataType: {
				get: () => type, enumerable: true,
				set: t => { sae_value.setAttribute('data-type', (type = t)) }
			}
		});
	}
	/** Create element inside target
	 * @param {HTMLElement} parent 
	 * @param {String} tag
	 */
	createIn(parent, tag) {
		return parent.appendChild(document.createElement(tag));
	}

	_onInput(e) {

		const { min, max } = this;
		const { left, width } = this.getBoundingClientRect();

		const slider  = this.lastElementChild;
		const marginX = slider.clientWidth,
		      maxLeft = width - marginX;

		let v = this.value || 0, x;
		if (v < min) {
			v = min, x = 0;
		} else  if ( v > max ) {
			v = max, x = maxLeft;
		} else {
			x = maxLeft * ((v - min) / (max - min));
		}
		this.value = v, slider.style.left = `${x}px`;
		this.dispatchEvent(new InputEvent('change', { bubbles: true }));
	}

	handleEvent(e) {
	
		const point = MUIDragable.getPoint(e);
		if ( !point )
			return;

		const { min, max } = this;
		const { left, width } = this.getBoundingClientRect();

		const slider  = this.lastElementChild;
		const marginX = slider.clientWidth,
		      maxLeft = width - marginX;

		const onAction = (pointX) => {
			let x = pointX - left - marginX, v;
			if (x < 0) {
				v = min, x = 0;
			} else  if ( x > maxLeft) {
				v = max, x = maxLeft;
			} else {
				v = (pointX - left) / width * max;
			}
			this.value = v, slider.style.left = `${x}px`;
			this.dispatchEvent(new InputEvent('change', { bubbles: true }));
		}
		e.preventDefault();
		e.stopPropagation();
		if (e.target !== slider)
			onAction(point.pointX);
		MUIDragable.addListener(slider, onAction, point.isTouch);
	}
};
customElements.define('sae-ruler', SanaeRuler);
